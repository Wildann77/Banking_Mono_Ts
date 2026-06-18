import {
  Controller,
  Get,
} from '@nestjs/common';

import { CheckHealthUseCase } from '@/app/application/use-cases/check-health.use-case';

@Controller('health')
export class HealthController {
  constructor(private readonly checkHealthUseCase: CheckHealthUseCase) {}

  @Get()
  async check() {
    return this.checkHealthUseCase.execute();
  }
}
