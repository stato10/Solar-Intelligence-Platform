import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateTariffDto } from "./dto/create-tariff.dto";
import { TariffsListQueryDto } from "./dto/tariffs-list-query.dto";
import { UpdateTariffDto } from "./dto/update-tariff.dto";
import { TariffsService } from "./tariffs.service";

@Controller("tariffs")
export class TariffsController {
  constructor(private readonly tariffsService: TariffsService) {}

  @Get()
  async findAll(@Query() query: TariffsListQueryDto) {
    const result = await this.tariffsService.findAll(query);
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
  async create(@Body() payload: CreateTariffDto) {
    return {
      success: true,
      data: await this.tariffsService.create(payload),
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
      data: await this.tariffsService.findOne(id),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() payload: UpdateTariffDto) {
    return {
      success: true,
      data: await this.tariffsService.update(id, payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
