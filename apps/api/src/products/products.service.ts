import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return (this.prisma as any).product.findMany({
      where: {
        isActive: true,
      },
    });
  }
}
