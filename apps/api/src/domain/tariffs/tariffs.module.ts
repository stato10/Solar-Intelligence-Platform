import { Module } from "@nestjs/common";
import { SitesModule } from "../sites/sites.module";
import { TariffsController } from "./tariffs.controller";
import { TariffsService } from "./tariffs.service";

@Module({
  imports: [SitesModule],
  controllers: [TariffsController],
  providers: [TariffsService],
  exports: [TariffsService]
})
export class TariffsModule {}
