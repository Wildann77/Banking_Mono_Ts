import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { randomUUID } from 'crypto';

import { AppModule } from '@/app/app.module';
import { GlobalExceptionFilter } from '@/shared/infrastructure/filters/global-exception.filter';
import { TransformInterceptor } from '@/shared/infrastructure/interceptors/transform.interceptor';
import { runWithTraceContext } from '@/shared/infrastructure/observability/trace-context.storage';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1').replace(/^\//, '');
  const frontendUrl = configService.get<string>('FRONTEND_URL');

  app.setGlobalPrefix(apiPrefix);
  app.use((req, _res, next) => {
    const request = req as typeof req & { id?: string };
    const traceId = String(request.id ?? request.headers['x-correlation-id'] ?? randomUUID());
    request.id = traceId;

    runWithTraceContext(traceId, next);
  });
  app.use(helmet());
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const origins = frontendUrl
    ? frontendUrl.split(',').map((url) => url.trim()).filter(Boolean)
    : false;

  app.enableCors({
    origin: origins,
    credentials: Boolean(frontendUrl),
  });

  await app.listen(port, '0.0.0.0');
}

bootstrap();
