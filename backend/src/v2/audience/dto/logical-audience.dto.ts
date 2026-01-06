import {
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LogicalOperator {
  AND = 'AND',
  OR = 'OR',
}

export enum ComparisonOperator {
  EQ = 'EQ', // Equals
  NEQ = 'NEQ', // Not Equals
  IN = 'IN', // In array
  NIN = 'NIN', // Not in array
  CONTAINS = 'CONTAINS', // String contains
  GT = 'GT', // Greater than
  LT = 'LT', // Less than
  GTE = 'GTE', // Greater than or equal
  LTE = 'LTE', // Less than or equal
}

export class LogicalRuleDto {
  @IsOptional()
  @IsEnum(LogicalOperator)
  operator?: LogicalOperator;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogicalRuleDto)
  rules?: LogicalRuleDto[];

  // Leaf node properties
  @IsOptional()
  @IsString()
  field?: string;

  @IsOptional()
  @IsEnum(ComparisonOperator)
  op?: ComparisonOperator;

  @IsOptional()
  value?: any;
}
