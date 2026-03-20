import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./config";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DomainModule } from "./domain";
import { IntegrationsModule } from "./integrations";

@Module({
  imports: [ConfigModule, AuthModule, IntegrationsModule, DomainModule, DashboardModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
