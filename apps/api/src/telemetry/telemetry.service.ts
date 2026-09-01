import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { SitesService } from "../domain/sites/sites.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConnectorFactory } from "./connectors/connector.factory";
import { InverterVendorId } from "./connectors/inverter-connector.interface";
import { decryptCredential, encryptCredential } from "./credential-crypto";
import { CreateConnectionDto } from "./dto/create-connection.dto";

/** Connection shape safe to return to clients (no credentials). */
export interface ConnectionView {
  siteId: string;
  vendor: InverterVendorId;
  externalSystemId: string | null;
  status: "pending" | "active" | "error" | "disconnected";
  lastSyncAt: string | null;
  lastError: string | null;
  createdAt: string;
}

export interface TelemetrySummary {
  connected: boolean;
  vendor: InverterVendorId | null;
  status: ConnectionView["status"] | null;
  lastReadingAt: string | null;
  last24hKwh: number | null;
  /** True when the newest reading is older than 2 hours. */
  stale: boolean;
}

const BACKFILL_DAYS = 7;
/** Re-fetch overlap so late vendor updates are corrected on the next sync. */
const SYNC_OVERLAP_MS = 60 * 60 * 1000;

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sitesService: SitesService,
    private readonly connectorFactory: ConnectorFactory
  ) {}

  async createConnection(dto: CreateConnectionDto, requesterId?: string): Promise<ConnectionView> {
    await this.sitesService.findOne(dto.siteId, requesterId);

    const connector = this.connectorFactory.forVendor(dto.vendor);
    const verify = await connector.verify({
      apiKey: dto.apiKey,
      externalSystemId: dto.externalSystemId
    });
    if (!verify.ok) {
      throw new BadRequestException(verify.error ?? "Inverter verification failed.");
    }

    const record = await this.prisma.inverterConnection.upsert({
      where: { siteId: dto.siteId },
      create: {
        siteId: dto.siteId,
        vendor: dto.vendor,
        externalSystemId: dto.externalSystemId ?? null,
        apiKeyEncrypted: encryptCredential(dto.apiKey),
        status: "active"
      },
      update: {
        vendor: dto.vendor,
        externalSystemId: dto.externalSystemId ?? null,
        apiKeyEncrypted: encryptCredential(dto.apiKey),
        status: "active",
        lastError: null
      }
    });

    // Initial backfill runs inline so the dashboard has data immediately
    // after connecting; failures downgrade status but don't block creation.
    try {
      await this.syncSite(dto.siteId);
    } catch (error) {
      this.logger.warn(
        `Initial telemetry backfill failed for site ${dto.siteId}: ${
          error instanceof Error ? error.message : "unknown"
        }`
      );
    }

    return this.toView({ ...record, status: "active" });
  }

  async getConnection(siteId: string, requesterId?: string): Promise<ConnectionView | null> {
    await this.sitesService.findOne(siteId, requesterId);
    const record = await this.prisma.inverterConnection.findUnique({ where: { siteId } });
    return record ? this.toView(record) : null;
  }

  async deleteConnection(siteId: string, requesterId?: string): Promise<void> {
    await this.sitesService.findOne(siteId, requesterId);
    const record = await this.prisma.inverterConnection.findUnique({ where: { siteId } });
    if (!record) {
      throw new NotFoundException(`No inverter connection for site ${siteId}`);
    }
    await this.prisma.inverterConnection.delete({ where: { siteId } });
  }

  /**
   * Pull new readings for one site. Used by the manual sync endpoint,
   * connection creation (backfill), and the 15-minute scheduler.
   */
  async syncSite(siteId: string, requesterId?: string): Promise<{ inserted: number }> {
    if (requesterId !== undefined) {
      await this.sitesService.findOne(siteId, requesterId);
    }
    const connection = await this.prisma.inverterConnection.findUnique({ where: { siteId } });
    if (!connection) {
      throw new NotFoundException(`No inverter connection for site ${siteId}`);
    }
    if (connection.status === "disconnected") {
      return { inserted: 0 };
    }

    const connector = this.connectorFactory.forVendor(connection.vendor as InverterVendorId);
    const until = new Date();
    const since = connection.lastSyncAt
      ? new Date(connection.lastSyncAt.getTime() - SYNC_OVERLAP_MS)
      : new Date(until.getTime() - BACKFILL_DAYS * 24 * 60 * 60 * 1000);

    try {
      const readings = await connector.fetchReadings(
        {
          apiKey: decryptCredential(connection.apiKeyEncrypted),
          externalSystemId: connection.externalSystemId ?? undefined
        },
        since,
        until
      );

      let inserted = 0;
      if (readings.length > 0) {
        const result = await this.prisma.telemetryReading.createMany({
          data: readings.map((r) => ({
            siteId,
            timestamp: r.timestamp,
            productionWh: r.productionWh,
            intervalMinutes: r.intervalMinutes,
            source: connection.vendor
          })),
          skipDuplicates: true
        });
        inserted = result.count;
      }

      await this.prisma.inverterConnection.update({
        where: { siteId },
        data: { status: "active", lastSyncAt: until, lastError: null }
      });
      return { inserted };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown sync error";
      await this.prisma.inverterConnection.update({
        where: { siteId },
        data: { status: "error", lastError: message }
      });
      throw new BadRequestException(`Telemetry sync failed: ${message}`);
    }
  }

  async getReadings(siteId: string, requesterId: string | undefined, hours: number) {
    await this.sitesService.findOne(siteId, requesterId);
    const clamped = Math.min(Math.max(hours, 1), 24 * BACKFILL_DAYS);
    const since = new Date(Date.now() - clamped * 60 * 60 * 1000);
    const readings = await this.prisma.telemetryReading.findMany({
      where: { siteId, timestamp: { gte: since } },
      orderBy: { timestamp: "asc" },
      select: { timestamp: true, productionWh: true, intervalMinutes: true, source: true }
    });
    return readings.map((r) => ({
      timestamp: r.timestamp.toISOString(),
      productionWh: r.productionWh,
      intervalMinutes: r.intervalMinutes,
      source: r.source
    }));
  }

  /**
   * Compact summary consumed by the dashboard aggregate. No ownership
   * check here — callers (dashboard query service) already gate access.
   */
  async getSummary(siteId: string): Promise<TelemetrySummary> {
    const connection = await this.prisma.inverterConnection.findUnique({ where: { siteId } });
    if (!connection) {
      return {
        connected: false,
        vendor: null,
        status: null,
        lastReadingAt: null,
        last24hKwh: null,
        stale: false
      };
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [latest, sum] = await Promise.all([
      this.prisma.telemetryReading.findFirst({
        where: { siteId },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true }
      }),
      this.prisma.telemetryReading.aggregate({
        where: { siteId, timestamp: { gte: dayAgo } },
        _sum: { productionWh: true }
      })
    ]);

    const lastReadingAt = latest?.timestamp ?? null;
    return {
      connected: connection.status === "active",
      vendor: connection.vendor as InverterVendorId,
      status: connection.status as ConnectionView["status"],
      lastReadingAt: lastReadingAt ? lastReadingAt.toISOString() : null,
      last24hKwh:
        sum._sum.productionWh !== null
          ? Math.round((sum._sum.productionWh / 1000) * 100) / 100
          : null,
      stale: lastReadingAt
        ? Date.now() - lastReadingAt.getTime() > 2 * 60 * 60 * 1000
        : false
    };
  }

  /** All connections eligible for the periodic sync. */
  async findSyncableSiteIds(): Promise<string[]> {
    const rows = await this.prisma.inverterConnection.findMany({
      where: { status: { in: ["active", "error", "pending"] } },
      select: { siteId: true }
    });
    return rows.map((r) => r.siteId);
  }

  private toView(record: {
    siteId: string;
    vendor: string;
    externalSystemId: string | null;
    status: string;
    lastSyncAt: Date | null;
    lastError: string | null;
    createdAt: Date;
  }): ConnectionView {
    return {
      siteId: record.siteId,
      vendor: record.vendor as InverterVendorId,
      externalSystemId: record.externalSystemId,
      status: record.status as ConnectionView["status"],
      lastSyncAt: record.lastSyncAt ? record.lastSyncAt.toISOString() : null,
      lastError: record.lastError,
      createdAt: record.createdAt.toISOString()
    };
  }
}
