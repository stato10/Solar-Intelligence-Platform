import { Module } from "@nestjs/common";
import { DevicesModule } from "./devices/devices.module";
import { SitesModule } from "./sites/sites.module";
import { SolarSystemsModule } from "./solar-systems/solar-systems.module";
import { TariffsModule } from "./tariffs/tariffs.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [UsersModule, SitesModule, SolarSystemsModule, DevicesModule, TariffsModule],
  exports: [UsersModule, SitesModule, SolarSystemsModule, DevicesModule, TariffsModule]
})
export class DomainModule {}
