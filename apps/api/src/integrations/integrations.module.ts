import { Module } from "@nestjs/common";
import { EngineModule } from "./engine/engine.module";

@Module({
  imports: [EngineModule],
  exports: [EngineModule]
})
export class IntegrationsModule {}
