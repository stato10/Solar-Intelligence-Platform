import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CreateSiteDto } from "./dto/create-site.dto";
import { SitesListQueryDto } from "./dto/sites-list-query.dto";
import { UpdateSiteDto } from "./dto/update-site.dto";
import { SitesService } from "./sites.service";

@UseGuards(JwtAuthGuard)
@Controller("sites")
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: SitesListQueryDto) {
    // Force filtering by the authenticated user
    query.userId = req.user.sub;
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
  async create(@Request() req: any, @Body() payload: CreateSiteDto) {
    return {
      success: true,
      // Ownership always comes from the authenticated user — never from the body.
      data: await this.sitesService.create({ ...payload, userId: req.user.sub }),
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
      data: await this.sitesService.findOne(id, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Request() req: any, @Param("id") id: string, @Body() payload: UpdateSiteDto) {
    return {
      success: true,
      data: await this.sitesService.update(id, payload, req.user.sub),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
