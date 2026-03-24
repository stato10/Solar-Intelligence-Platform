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

@Module({
  imports: [ConfigModule, AuthModule, IntegrationsModule, DomainModule, DashboardModule, AiModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes("*");
  }
}
