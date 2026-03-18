import { Module } from "@nestjs/common";
import { EngineController } from "./engine.controller";
import { EngineClientService } from "./engine-client.service";

@Module({
  controllers: [EngineController],
  providers: [EngineClientService],
  exports: [EngineClientService]
})
export class EngineModule {}
