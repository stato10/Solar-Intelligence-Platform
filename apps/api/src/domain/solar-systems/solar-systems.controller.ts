import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CreateSolarSystemDto } from "./dto/create-solar-system.dto";
import { SolarSystemsListQueryDto } from "./dto/solar-systems-list-query.dto";
import { UpdateSolarSystemDto } from "./dto/update-solar-system.dto";
import { SolarSystemsService } from "./solar-systems.service";

@UseGuards(JwtAuthGuard)
@Controller("solar-systems")
export class SolarSystemsController {
  constructor(private readonly solarSystemsService: SolarSystemsService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: SolarSystemsListQueryDto) {
    const result = await this.solarSystemsService.findAll(query, req.user.sub);
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
  async create(@Request() req: any, @Body() payload: CreateSolarSystemDto) {
    return {
      success: true,
      data: await this.solarSystemsService.create(payload, req.user.sub),
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
      data: await this.solarSystemsService.findOne(id, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Request() req: any, @Param("id") id: string, @Body() payload: UpdateSolarSystemDto) {
    return {
      success: true,
      data: await this.solarSystemsService.update(id, payload, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
