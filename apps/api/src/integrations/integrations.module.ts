import { Module } from "@nestjs/common";
import { EngineModule } from "./engine/engine.module";
import { ProvidersModule } from "./providers";

@Module({
  imports: [EngineModule, ProvidersModule],
  exports: [EngineModule, ProvidersModule]
})
export class IntegrationsModule {}
