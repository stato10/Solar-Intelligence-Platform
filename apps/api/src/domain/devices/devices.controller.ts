import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateDeviceProfileDto } from "./dto/create-device-profile.dto";
import { DevicesListQueryDto } from "./dto/devices-list-query.dto";
import { UpdateDeviceProfileDto } from "./dto/update-device-profile.dto";
import { DevicesService } from "./devices.service";

@Controller("devices")
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  async findAll(@Query() query: DevicesListQueryDto) {
    const result = await this.devicesService.findAll(query);
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
  async create(@Body() payload: CreateDeviceProfileDto) {
    return {
      success: true,
      data: await this.devicesService.create(payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return {
      success: true,
      data: await this.devicesService.findOne(id),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() payload: UpdateDeviceProfileDto) {
    return {
      success: true,
      data: await this.devicesService.update(id, payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
