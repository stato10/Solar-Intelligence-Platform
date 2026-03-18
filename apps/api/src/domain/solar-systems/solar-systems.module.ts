import { Module } from "@nestjs/common";
import { SolarSystemsController } from "./solar-systems.controller";
import { SolarSystemsService } from "./solar-systems.service";

@Module({
  controllers: [SolarSystemsController],
  providers: [SolarSystemsService],
  exports: [SolarSystemsService]
})
export class SolarSystemsModule {}
