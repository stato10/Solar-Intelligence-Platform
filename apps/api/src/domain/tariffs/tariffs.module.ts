import { Module } from "@nestjs/common";
import { SitesModule } from "../sites/sites.module";
import { PrismaTariffsRepository } from "./repositories/prisma-tariffs.repository";
import { TARIFFS_REPOSITORY } from "./repositories/tariffs.repository";
import { TariffsController } from "./tariffs.controller";
import { TariffsService } from "./tariffs.service";

@Module({
  imports: [SitesModule],
  controllers: [TariffsController],
  providers: [
    TariffsService,
    {
      provide: TARIFFS_REPOSITORY,
      useClass: PrismaTariffsRepository
    }
  ],
  exports: [TariffsService]
})
export class TariffsModule {}
