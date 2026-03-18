import { Controller, Get } from "@nestjs/common";
import { EngineClientService } from "./engine-client.service";

@Controller("integrations/engine")
export class EngineController {
  constructor(private readonly engineClientService: EngineClientService) {}

  @Get("health")
  async engineHealth() {
    const data = await this.engineClientService.checkHealth();
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        version: "v1"
      }
    };
  }
}
