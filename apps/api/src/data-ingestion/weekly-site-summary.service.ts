import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WeeklySiteSummaryService {
  private readonly logger = new Logger(WeeklySiteSummaryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregates the last 7 days of summaries for a site.
   */
  async getWeeklyAggregation(siteId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const summaries = await this.prisma.siteDailySummary.findMany({
      where: {
        siteId,
        date: { gte: sevenDaysAgo }
      },
      orderBy: { date: "asc" }
    });

    if (summaries.length === 0) {
      return { avgDeviation: 0, totalSavings: 0, daysCount: 0 };
    }

    const totalSavings = summaries.reduce((acc, curr) => acc + (curr.dailySavings || 0), 0);
    const avgDeviation = summaries.reduce((acc, curr) => acc + curr.deviationPercent, 0) / summaries.length;

    return {
      avgDeviation,
      totalSavings,
      daysCount: summaries.length
    };
  }
}
