import { Injectable } from '@nestjs/common';

import { TraceContextPort } from '@/shared/application/ports/trace-context.port';
import { getTraceIdFromContext } from '@/shared/infrastructure/observability/trace-context.storage';

@Injectable()
export class AsyncLocalTraceContextAdapter extends TraceContextPort {
  getTraceId(): string | undefined {
    return getTraceIdFromContext();
  }
}

// AsyncLocal trace context adapter
