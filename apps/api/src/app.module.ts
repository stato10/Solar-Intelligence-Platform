import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AiModule } from "./ai/ai.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./config";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DomainModule } from "./domain";
import { IntegrationsModule } from "./integrations";
import { RequestLoggingMiddleware } from "./observability/request-logging.middleware";
import { PrismaModule } from "./prisma/prisma.module";

import { LeadsModule } from "./leads/leads.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { ProvidersModule } from "./providers/providers.module";
import { ProductsModule } from "./products/products.module";

import { DataIngestionModule } from "./data-ingestion/data-ingestion.module";

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, IntegrationsModule, DomainModule, DashboardModule, AiModule, LeadsModule, MarketplaceModule, ProvidersModule, ProductsModule, DataIngestionModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");
  }
}
