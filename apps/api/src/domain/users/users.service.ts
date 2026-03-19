import { Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { paginateArray } from "../common/pagination";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersListQueryDto } from "./dto/users-list-query.dto";
import { UserEntity } from "./entities/user.entity";

@Injectable()
export class UsersService {
  private readonly users: UserEntity[] = [];

  findAll(query: UsersListQueryDto) {
    const search = query.search?.trim().toLowerCase();
    const filtered = this.users.filter((user) => {
      if (query.role && user.role !== query.role) {
        return false;
      }
      if (!search) {
        return true;
      }
      return (
        user.fullName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    });
    return paginateArray(filtered, query);
  }

  create(payload: CreateUserDto) {
    const now = new Date().toISOString();
    const user: UserEntity = {
      id: randomUUID(),
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      role: payload.role,
      createdAt: now,
      updatedAt: now
    };
    this.users.push(user);
    return user;
  }

  findOne(id: string) {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  update(id: string, payload: UpdateUserDto) {
    const user = this.findOne(id);
    if (payload.fullName !== undefined) {
      user.fullName = payload.fullName;
    }
    if (payload.email !== undefined) {
      user.email = payload.email.toLowerCase();
    }
    if (payload.role !== undefined) {
      user.role = payload.role;
    }
    user.updatedAt = new Date().toISOString();
    return user;
  }
}
