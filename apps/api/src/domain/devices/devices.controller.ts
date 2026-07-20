import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CreateDeviceProfileDto } from "./dto/create-device-profile.dto";
import { DevicesListQueryDto } from "./dto/devices-list-query.dto";
import { UpdateDeviceProfileDto } from "./dto/update-device-profile.dto";
import { DevicesService } from "./devices.service";

@UseGuards(JwtAuthGuard)
@Controller("devices")
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: DevicesListQueryDto) {
    const result = await this.devicesService.findAll(query, req.user.sub);
    return {
      success: true,
      data: result.items,
      meta: {
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Post()
  async create(@Request() req: any, @Body() payload: CreateDeviceProfileDto) {
    return {
      success: true,
      data: await this.devicesService.create(payload, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    return {
      success: true,
      data: await this.devicesService.findOne(id, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Request() req: any, @Param("id") id: string, @Body() payload: UpdateDeviceProfileDto) {
    return {
      success: true,
      data: await this.devicesService.update(id, payload, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
