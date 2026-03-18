import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule } from "./config";
import { IntegrationsModule } from "./integrations";

@Module({
  imports: [ConfigModule, AuthModule, IntegrationsModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
