import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DatabaseHealthPort } from '@/app/application/ports/database-health.port';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

@Injectable()
export class PrismaDatabaseHealthAdapter extends DatabaseHealthPort {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw(Prisma.sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }
}
