import { Module } from "@nestjs/common";
import { SitesModule } from "../sites/sites.module";
import { PrismaSolarSystemsRepository } from "./repositories/prisma-solar-systems.repository";
import { SOLAR_SYSTEMS_REPOSITORY } from "./repositories/solar-systems.repository";
import { SolarSystemsController } from "./solar-systems.controller";
import { SolarSystemsService } from "./solar-systems.service";

@Module({
  imports: [SitesModule],
  controllers: [SolarSystemsController],
  providers: [
    SolarSystemsService,
    {
      provide: SOLAR_SYSTEMS_REPOSITORY,
      useClass: PrismaSolarSystemsRepository
    }
  ],
  exports: [SolarSystemsService]
})
export class SolarSystemsModule {}
