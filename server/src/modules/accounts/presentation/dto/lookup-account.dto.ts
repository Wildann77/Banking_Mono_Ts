import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LookupAccountDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{6,20}$/, { message: 'accountNumber must be 6-20 digits' })
  accountNumber: string;
}

// LookupAccountDto: validation schema
