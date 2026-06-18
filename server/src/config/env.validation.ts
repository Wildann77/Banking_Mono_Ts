import * as Joi from 'joi';

const secretFor = (name: string) =>
  Joi.when('NODE_ENV', {
    is: 'test',
    then: Joi.string().min(16).default(`test-${name}-secret-value`),
    otherwise: Joi.string().min(32).required(),
  });

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('/api/v1'),

  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),
  FRONTEND_URL: Joi.string().allow('').optional(),

  JWT_ACCESS_SECRET: secretFor('access'),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: secretFor('refresh'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(14).default(12),

  SMTP_HOST: Joi.string().allow('').optional(),
  SMTP_PORT: Joi.number().integer().min(1).max(65535).default(587),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASS: Joi.string().allow('').optional(),

  COOKIE_SECURE: Joi.boolean().default(true),
  COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
  COOKIE_DOMAIN: Joi.string().allow('').optional(),

  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().integer().default(6379),

  OPERATIONS_GRPC_URL: Joi.string().default('localhost:50051'),
}).unknown(true);
