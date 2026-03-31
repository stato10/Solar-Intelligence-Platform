import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateSolarSystemDto } from "./dto/create-solar-system.dto";
import { SolarSystemsListQueryDto } from "./dto/solar-systems-list-query.dto";
import { UpdateSolarSystemDto } from "./dto/update-solar-system.dto";
import { SolarSystemsService } from "./solar-systems.service";

@Controller("solar-systems")
export class SolarSystemsController {
  constructor(private readonly solarSystemsService: SolarSystemsService) {}

  @Get()
  async findAll(@Query() query: SolarSystemsListQueryDto) {
    const result = await this.solarSystemsService.findAll(query);
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
  async create(@Body() payload: CreateSolarSystemDto) {
    return {
      success: true,
      data: await this.solarSystemsService.create(payload),
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
      data: await this.solarSystemsService.findOne(id),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() payload: UpdateSolarSystemDto) {
    return {
      success: true,
      data: await this.solarSystemsService.update(id, payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
