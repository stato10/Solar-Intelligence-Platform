import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { CreateSolarSystemDto } from "./dto/create-solar-system.dto";
import { UpdateSolarSystemDto } from "./dto/update-solar-system.dto";
import { SolarSystemsService } from "./solar-systems.service";

@Controller("solar-systems")
export class SolarSystemsController {
  constructor(private readonly solarSystemsService: SolarSystemsService) {}

  @Get()
  findAll() {
    return {
      success: true,
      data: this.solarSystemsService.findAll(),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Post()
  create(@Body() payload: CreateSolarSystemDto) {
    return {
      success: true,
      data: this.solarSystemsService.create(payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return {
      success: true,
      data: this.solarSystemsService.findOne(id),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateSolarSystemDto) {
    return {
      success: true,
      data: this.solarSystemsService.update(id, payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
