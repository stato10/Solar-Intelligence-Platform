import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MonthlySiteSummaryService {
  private readonly logger = new Logger(MonthlySiteSummaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a structural overview of the last 30 days.
   */
  async getMonthlyAggregation(siteId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const summaries = await this.prisma.siteDailySummary.findMany({
      where: {
        siteId,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: "asc" }
    });

    if (summaries.length === 0) {
      return { trend: "stable", avgDeviation: 0, totalSavings: 0 };
    }

    const totalSavings = summaries.reduce((acc, curr) => acc + (curr.dailySavings || 0), 0);
    const avgDeviation = summaries.reduce((acc, curr) => acc + curr.deviationPercent, 0) / summaries.length;
    
    // Very basic trend detection
    const trend = avgDeviation < -5 ? "declining" : avgDeviation > 5 ? "improving" : "stable";

    return {
      trend,
      avgDeviation,
      totalSavings,
      daysCount: summaries.length
    };
  }
}
