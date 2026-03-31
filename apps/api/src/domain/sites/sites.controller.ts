import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateSiteDto } from "./dto/create-site.dto";
import { SitesListQueryDto } from "./dto/sites-list-query.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import { SitesService } from "./sites.service";

@Controller("sites")
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  async findAll(@Query() query: SitesListQueryDto) {
    const result = await this.sitesService.findAll(query);
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
  async create(@Body() payload: CreateSiteDto) {
    return {
      success: true,
      data: await this.sitesService.create(payload),
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
      data: await this.sitesService.findOne(id),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() payload: UpdateSiteDto) {
    return {
      success: true,
      data: await this.sitesService.update(id, payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
