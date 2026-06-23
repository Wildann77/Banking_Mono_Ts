import { Injectable } from '@nestjs/common';
import { Prisma, RefreshSession as RefreshSessionRecord } from '@prisma/client';

import { RefreshSessionRepositoryPort } from '@/modules/identity-access/application/ports/refresh-session.repository.port';
import { RefreshSession } from '@/modules/identity-access/domain/refresh-session.entity';
import { PrismaService } from '@/shared/infrastructure/database/prisma.service';

@Injectable()
export class RefreshSessionRepositoryAdapter implements RefreshSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private mapToDomain(record: RefreshSessionRecord): RefreshSession {
    return RefreshSession.reconstruct(
      {
        userId: record.user_id,
        tokenHash: record.token_hash,
        jti: record.jti,
        familyId: record.family_id,
        expiresAt: record.expires_at,
        revokedAt: record.revoked_at,
        replacedBySessionId: record.replaced_by_session_id,
        userAgent: record.user_agent,
        ipAddress: record.ip_address,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      },
      record.id,
    );
  }

  async save(session: RefreshSession): Promise<void> {
    await this.prisma.refreshSession.upsert({
      where: { id: session.id },
      update: {
        revoked_at: session.revokedAt,
        replaced_by_session_id: session.replacedBySessionId,
        updated_at: session.updatedAt,
      },
      create: {
        id: session.id,
        user_id: session.userId,
        token_hash: session.tokenHash,
        jti: session.jti,
        family_id: session.familyId,
        expires_at: session.expiresAt,
        revoked_at: session.revokedAt,
        replaced_by_session_id: session.replacedBySessionId,
        user_agent: session.userAgent,
        ip_address: session.ipAddress,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
      },
    });
  }

  async findById(id: string): Promise<RefreshSession | null> {
    const record = await this.prisma.refreshSession.findUnique({ where: { id } });
    return record ? this.mapToDomain(record) : null;
  }

  async findByJti(jti: string): Promise<RefreshSession | null> {
    const record = await this.prisma.refreshSession.findUnique({ where: { jti } });
    return record ? this.mapToDomain(record) : null;
  }

  async findByJtiWithLock(jti: string): Promise<RefreshSession | null> {
    const records = await this.prisma.$queryRaw<RefreshSessionRecord[]>(
      Prisma.sql`SELECT * FROM refresh_sessions WHERE jti = ${jti} FOR UPDATE`,
    );

    return records[0] ? this.mapToDomain(records[0]) : null;
  }

  async findByFamilyId(familyId: string): Promise<RefreshSession[]> {
    const records = await this.prisma.refreshSession.findMany({
      where: { family_id: familyId },
      orderBy: { created_at: 'asc' },
    });
    return records.map((record) => this.mapToDomain(record));
  }

  async revokeFamily(familyId: string): Promise<number> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { family_id: familyId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    return result.count;
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });

    return result.count;
  }
}

// RefreshSessionRepositoryAdapter: Prisma impl
