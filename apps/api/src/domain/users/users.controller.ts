import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersListQueryDto } from "./dto/users-list-query.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() query: UsersListQueryDto) {
    const result = this.usersService.findAll(query);
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
  create(@Body() payload: CreateUserDto) {
    return {
      success: true,
      data: this.usersService.create(payload),
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
      data: this.usersService.findOne(id),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateUserDto) {
    return {
      success: true,
      data: this.usersService.update(id, payload),
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
