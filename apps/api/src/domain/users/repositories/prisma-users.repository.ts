import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { UserEntity } from "../entities/user.entity";
import { UsersRepository } from "./users.repository";

function toUserEntity(model: {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "admin";
  createdAt: Date;
  updatedAt: Date;
}): UserEntity {
  return {
    id: model.id,
    fullName: model.fullName,
    email: model.email,
    role: model.role,
    createdAt: model.createdAt.toISOString(),
    updatedAt: model.updatedAt.toISOString()
  };
}

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" }
    });
    return users.map(toUserEntity);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    return user ? toUserEntity(user) : null;
  }

  async create(payload: CreateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email.toLowerCase(),
        role: payload.role,
        // Domain users currently do not provide passwords in this flow.
        passwordHash: "domain_user_placeholder_hash"
      }
    });
    return toUserEntity(user);
  }

  async update(id: string, payload: UpdateUserDto): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(payload.fullName !== undefined ? { fullName: payload.fullName } : {}),
        ...(payload.email !== undefined ? { email: payload.email.toLowerCase() } : {}),
        ...(payload.role !== undefined ? { role: payload.role } : {})
      }
    });
    return toUserEntity(user);
  }
}
