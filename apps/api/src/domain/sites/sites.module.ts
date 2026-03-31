import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module";
import { PrismaSitesRepository } from "./repositories/prisma-sites.repository";
import { SITES_REPOSITORY } from "./repositories/sites.repository";
import { SitesController } from "./sites.controller";
import { SitesService } from "./sites.service";

@Module({
  imports: [UsersModule],
  controllers: [SitesController],
  providers: [
    SitesService,
    {
      provide: SITES_REPOSITORY,
      useClass: PrismaSitesRepository
    }
  ],
  exports: [SitesService]
})
export class SitesModule {}
