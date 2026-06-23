import { Injectable } from '@nestjs/common';
import { Prisma, User as UserRecord } from '@prisma/client';

import { UserRepositoryPort } from '@/modules/identity-access/application/ports/user.repository.port';
import { User } from '@/modules/identity-access/domain/user.entity';
import { EmailAddress } from '@/modules/identity-access/domain/value-objects/email-address.vo';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

@Injectable()
export class UserRepositoryAdapter implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(record: UserRecord): User {
    return User.reconstruct(
      {
        email: EmailAddress.create(record.email),
        name: record.name,
        passwordHash: record.password_hash,
        tokenVersion: record.token_version,
        systemUser: record.system_user,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      },
      record.id,
    );
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email.value,
        name: user.name,
        password_hash: user.passwordHash,
        token_version: user.tokenVersion,
        system_user: user.systemUser,
        updated_at: user.updatedAt,
      },
      create: {
        id: user.id,
        email: user.email.value,
        name: user.name,
        password_hash: user.passwordHash,
        token_version: user.tokenVersion,
        system_user: user.systemUser,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { id } });
    return record ? this.mapToDomain(record) : null;
  }

  async findByEmail(email: EmailAddress): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email: email.value } });
    return record ? this.mapToDomain(record) : null;
  }

  async findByIdWithLock(id: string): Promise<User | null> {
    const records = await this.prisma.$queryRaw<UserRecord[]>(
      Prisma.sql`SELECT * FROM users WHERE id = ${id} FOR UPDATE`,
    );

    return records[0] ? this.mapToDomain(records[0]) : null;
  }
}

// UserRepositoryAdapter: Prisma implementation
