import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SnapshotWriterService {
  private readonly logger = new Logger(SnapshotWriterService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Current Snapshot ───────────────────────────────────────────────

  /**
   * Retrieves the current snapshot for a site if it exists.
   */
  async getCurrentSnapshot(siteId: string) {
    try {
      return await this.prisma.siteCurrentSnapshot.findUnique({
        where: { siteId }
      });
    } catch (error) {
      this.logger.error(`Failed to get current snapshot for site ${siteId}`, error);
      return null;
    }
  }

  /**
   * Upserts the current snapshot for a site.
   */
  async saveCurrentSnapshot(params: {
    siteId: string;
    weatherJson: any;
    solarJson: any;
    aggregateJson: any;
    aiContextJson?: any;
  }) {
    try {
      return await this.prisma.siteCurrentSnapshot.upsert({
        where: { siteId: params.siteId },
        update: {
          fetchedAt: new Date(),
          weatherJson: params.weatherJson,
          solarJson: params.solarJson,
          aggregateJson: params.aggregateJson,
          aiContextJson: params.aiContextJson
        },
        create: {
          siteId: params.siteId,
          fetchedAt: new Date(),
          weatherJson: params.weatherJson,
          solarJson: params.solarJson,
          aggregateJson: params.aggregateJson,
          aiContextJson: params.aiContextJson
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save current snapshot for site ${params.siteId}`, error);
      throw error;
    }
  }

  // ─── Daily Summary ──────────────────────────────────────────────────

  /**
   * Upserts a daily summary record.
   */
  async saveDailySummary(params: {
    siteId: string;
    date: Date;
    expectedKwh: number;
    actualKwh: number;
    deviationPercent: number;
    soilingScore?: number;
    heatScore?: number;
    dailySavings?: number;
  }) {
    // Normalize date to start of day UTC to prevent timezone splits
    const normalizedDate = new Date(
      Date.UTC(params.date.getUTCFullYear(), params.date.getUTCMonth(), params.date.getUTCDate())
    );

    try {
      return await this.prisma.siteDailySummary.upsert({
        where: {
          siteId_date: {
            siteId: params.siteId,
            date: normalizedDate
          }
        },
        update: {
          expectedKwh: params.expectedKwh,
          actualKwh: params.actualKwh,
          deviationPercent: params.deviationPercent,
          soilingScore: params.soilingScore,
          heatScore: params.heatScore,
          dailySavings: params.dailySavings
        },
        create: {
          siteId: params.siteId,
          date: normalizedDate,
          expectedKwh: params.expectedKwh,
          actualKwh: params.actualKwh,
          deviationPercent: params.deviationPercent,
          soilingScore: params.soilingScore,
          heatScore: params.heatScore,
          dailySavings: params.dailySavings
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save daily summary for site ${params.siteId}`, error);
      throw error;
    }
  }

  /**
   * Retrieves daily summaries within a date range for a site.
   * Used by weekly/monthly aggregation services.
   */
  async getDailySummariesForRange(siteId: string, startDate: Date, endDate: Date) {
    try {
      return await this.prisma.siteDailySummary.findMany({
        where: {
          siteId,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { date: "asc" }
      });
    } catch (error) {
      this.logger.error(`Failed to get daily summaries for site ${siteId}`, error);
      return [];
    }
  }

  /**
   * Retrieves the N most recent daily summaries for a site.
   */
  async getLatestDailySummaries(siteId: string, count: number) {
    try {
      return await this.prisma.siteDailySummary.findMany({
        where: { siteId },
        orderBy: { date: "desc" },
        take: count
      });
    } catch (error) {
      this.logger.error(`Failed to get latest daily summaries for site ${siteId}`, error);
      return [];
    }
  }

  // ─── Monthly Summary ────────────────────────────────────────────────

  /**
   * Upserts a monthly summary record.
   */
  async saveMonthlySummary(params: {
    siteId: string;
    month: Date;
    totalExpected: number;
    totalActual: number;
    totalSavings?: number;
    avgDeviation: number;
  }) {
    // Normalize to first day of the month
    const normalizedMonth = new Date(
      Date.UTC(params.month.getUTCFullYear(), params.month.getUTCMonth(), 1)
    );

    try {
      return await this.prisma.siteMonthlySummary.upsert({
        where: {
          siteId_month: {
            siteId: params.siteId,
            month: normalizedMonth
          }
        },
        update: {
          totalExpected: params.totalExpected,
          totalActual: params.totalActual,
          totalSavings: params.totalSavings,
          avgDeviation: params.avgDeviation
        },
        create: {
          siteId: params.siteId,
          month: normalizedMonth,
          totalExpected: params.totalExpected,
          totalActual: params.totalActual,
          totalSavings: params.totalSavings,
          avgDeviation: params.avgDeviation
        }
      });
    } catch (error) {
      this.logger.error(`Failed to save monthly summary for site ${params.siteId}`, error);
      throw error;
    }
  }
}
