import { Module } from "@nestjs/common";
import { SitesModule } from "../sites/sites.module";
import { DevicesController } from "./devices.controller";
import { PrismaDevicesRepository } from "./repositories/prisma-devices.repository";
import { DEVICES_REPOSITORY } from "./repositories/devices.repository";
import { DevicesService } from "./devices.service";

@Module({
  imports: [SitesModule],
  controllers: [DevicesController],
  providers: [
    DevicesService,
    {
      provide: DEVICES_REPOSITORY,
      useClass: PrismaDevicesRepository
    }
  ],
  exports: [DevicesService]
})
export class DevicesModule {}
