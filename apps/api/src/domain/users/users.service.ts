import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { paginateArray } from "../common/pagination";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersListQueryDto } from "./dto/users-list-query.dto";
import { USERS_REPOSITORY, UsersRepository } from "./repositories/users.repository";

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository
  ) {}

  async findAll(query: UsersListQueryDto) {
    const users = await this.usersRepository.findAll();
    const search = query.search?.trim().toLowerCase();
    const filtered = users.filter((user) => {
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

  async create(payload: CreateUserDto) {
    return this.usersRepository.create(payload);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async update(id: string, payload: UpdateUserDto) {
    await this.findOne(id);
    return this.usersRepository.update(id, payload);
  }
}
