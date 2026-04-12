import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (this.prisma as any).provider.findMany({
      where: {
        isActive: true,
      },
    });
  }
}
