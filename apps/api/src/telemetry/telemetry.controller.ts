import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreateConnectionDto } from "./dto/create-connection.dto";
import { TelemetryService } from "./telemetry.service";

function envelope<T>(data: T) {
  return {
    success: true,
    data,
    meta: { timestamp: new Date().toISOString(), version: "v1" }
  };
}

@UseGuards(JwtAuthGuard)
@Controller("telemetry")
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post("connections")
  async createConnection(@Request() req: any, @Body() payload: CreateConnectionDto) {
    return envelope(await this.telemetryService.createConnection(payload, req.user.sub));
  }

  @Get("connections/:siteId")
  async getConnection(@Request() req: any, @Param("siteId") siteId: string) {
    return envelope(await this.telemetryService.getConnection(siteId, req.user.sub));
  }

  @Delete("connections/:siteId")
  async deleteConnection(@Request() req: any, @Param("siteId") siteId: string) {
    await this.telemetryService.deleteConnection(siteId, req.user.sub);
    return envelope({ deleted: true });
  }

  @Post("connections/:siteId/sync")
  async syncSite(@Request() req: any, @Param("siteId") siteId: string) {
    return envelope(await this.telemetryService.syncSite(siteId, req.user.sub));
  }

  @Get("sites/:siteId/readings")
  async getReadings(
    @Request() req: any,
    @Param("siteId") siteId: string,
    @Query("hours") hours?: string
  ) {
    const parsed = hours ? Number.parseInt(hours, 10) : 24;
    return envelope(
      await this.telemetryService.getReadings(
        siteId,
        req.user.sub,
        Number.isFinite(parsed) ? parsed : 24
      )
    );
  }
}
