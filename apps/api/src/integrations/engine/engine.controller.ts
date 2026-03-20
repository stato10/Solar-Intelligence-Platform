import { Body, Controller, Get, Post } from "@nestjs/common";
import { EngineClientService } from "./engine-client.service";
import { EngineCalculateV1RequestDto } from "./dto/engine-calculate-v1.dto";

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

  @Post("calculate/v1")
  async calculateV1(@Body() payload: EngineCalculateV1RequestDto) {
    const data = await this.engineClientService.calculateV1(payload);
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
