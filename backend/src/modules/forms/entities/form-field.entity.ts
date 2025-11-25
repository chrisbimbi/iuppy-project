// src/forms/entities/form-field.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { TranslatableString } from './form.entity';

export type FormFieldType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'multi_choice'
  | 'single_choice'
  | 'stars'
  | 'scale';

@Entity('form_field')
@Index(['companyId', 'formId', 'version'])
export class FormFieldEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  companyId: string;

  @Column('uuid')
  formId: string;

  @Column('int', { default: 1 })
  version: number;

  @Column('text')
  type: FormFieldType;

  // ==================================
  // MODIFICADO (Traduções - Fase 3)
  // ==================================
  @Column('jsonb')
  label: TranslatableString | string;
  // ==================================

  @Column('boolean', { default: false })
  required: boolean;

  @Column('jsonb', { nullable: true })
  options: any | null; // { choices: [], min: 1, max: 10 }

  @Column('int', { default: 0 })
  order: number;

  @CreateDateColumn()
  createdAt: Date;
}