import { Controller, Get } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  async findAll() {
    const providers = await this.providersService.findAll();
    return {
      success: true,
      data: providers,
    };
  }
}
