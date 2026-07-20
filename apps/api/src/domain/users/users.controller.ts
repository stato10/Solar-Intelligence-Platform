import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersListQueryDto } from "./dto/users-list-query.dto";
import { UsersService } from "./users.service";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: UsersListQueryDto) {
    // Non-admins may only see their own record.
    if (req.user.role !== "admin") {
      const self = await this.usersService.findOne(req.user.sub);
      return {
        success: true,
        data: [self],
        meta: {
          pagination: { page: 1, limit: 1, total: 1, totalPages: 1 },
          timestamp: new Date().toISOString(),
          version: "v1"
        }
      };
    }

    const result = await this.usersService.findAll(query);
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
  async create(@Request() req: any, @Body() payload: CreateUserDto) {
    // Self-service accounts are created via /auth/register (with a real
    // password). Direct domain-user creation is an admin operation.
    if (req.user.role !== "admin") {
      throw new ForbiddenException("Only admins can create users directly. Use /auth/register.");
    }
    return {
      success: true,
      data: await this.usersService.create(payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    if (req.user.role !== "admin" && req.user.sub !== id) {
      throw new ForbiddenException("You can only view your own user record.");
    }
    return {
      success: true,
      data: await this.usersService.findOne(id),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  async update(@Request() req: any, @Param("id") id: string, @Body() payload: UpdateUserDto) {
    if (req.user.role !== "admin" && req.user.sub !== id) {
      throw new ForbiddenException("You can only update your own user record.");
    }
    // Prevent privilege escalation: only admins may change roles.
    if (req.user.role !== "admin") {
      delete payload.role;
    }
    return {
      success: true,
      data: await this.usersService.update(id, payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
