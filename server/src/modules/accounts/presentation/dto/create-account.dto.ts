import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, IsIn } from 'class-validator';
import { SUPPORTED_CURRENCIES } from '@/shared/kernel/domain/value-objects/supported-currencies';

export class CreateAccountDto {
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @IsIn(SUPPORTED_CURRENCIES)
  @Transform(({ value }) => value?.trim().toUpperCase())
  // Default applied in use case when omitted.
  currency?: string;
}

// CreateAccountDto: validation schema
