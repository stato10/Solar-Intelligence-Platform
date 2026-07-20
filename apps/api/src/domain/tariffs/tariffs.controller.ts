import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { TariffsListQueryDto } from "./dto/tariffs-list-query.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { TariffsService } from "./tariffs.service";

@UseGuards(JwtAuthGuard)
@Controller("tariffs")
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: TariffsListQueryDto) {
    const result = await this.tariffsService.findAll(query, req.user.sub);
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
  async create(@Request() req: any, @Body() payload: CreateTariffDto) {
    return {
      success: true,
      data: await this.tariffsService.create(payload, req.user.sub),
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
      data: await this.tariffsService.findOne(id, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Request() req: any, @Param("id") id: string, @Body() payload: UpdateTariffDto) {
    return {
      success: true,
      data: await this.tariffsService.update(id, payload, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
