import { Inject, Injectable } from '@nestjs/common';

import { DatabaseHealthPort } from '@/app/application/ports/database-health.port';
import { DomainError } from '@/shared/domain/errors';

@Injectable()
export class CheckHealthUseCase {
  constructor(
    @Inject(DatabaseHealthPort)
    private readonly databaseHealth: DatabaseHealthPort,
  ) {}

  async execute() {
    const isHealthy = await this.databaseHealth.isHealthy();
    if (!isHealthy) {
      throw new DomainError('Database is unavailable', 'SERVICE_UNAVAILABLE', 503);
    }

    return {
      status: 'ok',
      database: 'connected',
    };
  }
}
