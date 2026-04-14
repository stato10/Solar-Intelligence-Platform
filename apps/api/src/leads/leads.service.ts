import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type LocalLeadSourceType = 'cleaning_recommendation' | 'battery_recommendation' | 'ev_recommendation' | 'automation_recommendation';

import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class CreateLeadIntentDto {
  @IsString()
  siteId!: string;

  @IsString()
  sourceType!: LocalLeadSourceType;

  @IsOptional()
  @IsString()
  sourceReference?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsNumber()
  estimatedValue?: number;

  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async createIntent(userId: string, dto: CreateLeadIntentDto) {
    // Verify site belongs to user (skip verification for demo sites)
    if (dto.siteId !== 'site-demo-001') {
      const site = await this.prisma.site.findFirst({
        where: {
          id: dto.siteId,
          userId: userId,
        },
      });

      if (!site) {
        throw new NotFoundException(`Site not found or does not belong to user`);
      }
    }

    try {
      return await (this.prisma as any).leadIntent.create({
        data: {
          siteId: dto.siteId,
          userId: userId,
          sourceType: dto.sourceType,
          sourceReference: dto.sourceReference,
          title: dto.title,
          message: dto.message,
          estimatedValue: dto.estimatedValue,
          metadataJson: (dto.metadataJson ?? {}) as any,
          status: 'new_lead',
        },
      });
    } catch (e: any) {
      console.error("FATAL ERROR IN CREATE_INTENT", e);
      throw e;
    }
  }

  async getIntentsForSite(userId: string, siteId: string) {
    // Verify site belongs to user (skip verification for demo sites)
    if (siteId !== 'site-demo-001') {
      const site = await this.prisma.site.findFirst({
        where: {
          id: siteId,
          userId: userId,
        },
      });

      if (!site) {
        throw new NotFoundException(`Site not found or does not belong to user`);
      }
    }

    return (this.prisma as any).leadIntent.findMany({
      where: {
        siteId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
