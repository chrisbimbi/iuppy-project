import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { UserEntity } from '../../users/user.entity';
import {
  LogicalRuleDto,
  LogicalOperator,
  ComparisonOperator,
} from './dto/logical-audience.dto';

@Injectable()
export class LogicalAudienceService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async resolveUserIds(
    companyId: string,
    rule: LogicalRuleDto,
  ): Promise<string[]> {
    const qb = this.userRepo.createQueryBuilder('user');
    qb.select('user.id');
    qb.where('user.companyId = :companyId', { companyId });
    qb.andWhere('user.isActive = :isActive', { isActive: true });

    if (rule) {
      qb.andWhere(
        new Brackets((innerQb) => {
          this.buildQuery(innerQb, rule);
        }),
      );
    }

    const users = await qb.getMany();
    return users.map((u) => u.id);
  }

  private buildQuery(qb: any, rule: LogicalRuleDto) {
    if (
      rule.operator === LogicalOperator.AND ||
      rule.operator === LogicalOperator.OR
    ) {
      if (!rule.rules || rule.rules.length === 0) return;

      const isAnd = rule.operator === LogicalOperator.AND;

      // Iterate over child rules
      rule.rules.forEach((childRule, index) => {
        const method = index === 0 ? 'where' : isAnd ? 'andWhere' : 'orWhere';

        qb[method](
          new Brackets((innerQb: any) => {
            this.buildQuery(innerQb, childRule);
          }),
        );
      });
    } else {
      // Leaf node
      this.applyCondition(qb, rule);
    }
  }

  private applyCondition(qb: any, rule: LogicalRuleDto) {
    if (!rule.field || !rule.op) return;

    // Map frontend field names to DB columns
    // "department" -> "user.department"
    // "custom.something" -> jsonb query
    const dbField = this.mapField(rule.field);
    const paramName = `p_${Math.random().toString(36).substring(7)}`;
    const value = rule.value;

    switch (rule.op) {
      case ComparisonOperator.EQ:
        qb.where(`${dbField} = :${paramName}`, { [paramName]: value });
        break;
      case ComparisonOperator.NEQ:
        qb.where(`${dbField} != :${paramName}`, { [paramName]: value });
        break;
      case ComparisonOperator.CONTAINS:
        qb.where(`${dbField} ILIKE :${paramName}`, {
          [paramName]: `%${value}%`,
        });
        break;
      case ComparisonOperator.GT:
        qb.where(`${dbField} > :${paramName}`, { [paramName]: value });
        break;
      case ComparisonOperator.LT:
        qb.where(`${dbField} < :${paramName}`, { [paramName]: value });
        break;
      case ComparisonOperator.GTE:
        qb.where(`${dbField} >= :${paramName}`, { [paramName]: value });
        break;
      case ComparisonOperator.LTE:
        qb.where(`${dbField} <= :${paramName}`, { [paramName]: value });
        break;
      case ComparisonOperator.IN:
        qb.where(`${dbField} IN (:...${paramName})`, { [paramName]: value });
        break;
      case ComparisonOperator.NIN:
        qb.where(`${dbField} NOT IN (:...${paramName})`, {
          [paramName]: value,
        });
        break;
    }
  }

  private mapField(field: string): string {
    // Allow direct access to known columns
    const allowedColumns = [
      'department',
      'jobTitle',
      'location',
      'email',
      'role',
      'id',
    ];
    if (allowedColumns.includes(field)) {
      return `user."${field}"`;
    }

    // Handle custom attributes (jsonb)
    // field: "custom.time_futebol" -> user.customAttributes ->> 'time_futebol'
    if (field.startsWith('custom.')) {
      const key = field.replace('custom.', '');
      return `user."customAttributes" ->> '${key}'`;
    }

    // Fallback or error? For now fallback to customAttributes search if not standard
    return `user."customAttributes" ->> '${field}'`;
  }
}
