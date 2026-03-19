import { Module } from "@nestjs/common";
import { SitesModule } from "../sites/sites.module";
import { SolarSystemsController } from "./solar-systems.controller";
import { SolarSystemsService } from "./solar-systems.service";

@Module({
  imports: [SitesModule],
  controllers: [SolarSystemsController],
  providers: [SolarSystemsService],
  exports: [SolarSystemsService]
})
export class SolarSystemsModule {}
