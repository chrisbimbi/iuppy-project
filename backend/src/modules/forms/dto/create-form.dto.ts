// src/forms/dto/create-form.dto.ts
import type { FormStatus, TranslatableString } from '../entities/form.entity'; // Importa o novo tipo
import type { FormFieldType } from '../entities/form-field.entity';

export interface CreateFormFieldDto {
  type: FormFieldType;
  label: TranslatableString; // MODIFICADO
  required?: boolean;
  options?: Record<string, any> | null;
  order?: number;
}

export interface CreateFormDto {
  companyId: string;
  title: TranslatableString; // MODIFICADO
  description?: TranslatableString | null; // MODIFICADO
  status?: FormStatus;
  scheduleStartAt?: string | null;
  scheduleEndAt?: string | null;
  deadlineAt?: string | null;
  allowMultipleSubmissions?: boolean;
  anonymous?: boolean;
  allowExternal?: boolean;
  audienceSpaceIds?: string[];
  audienceGroupIds?: string[];
  attachmentsAllowed?: boolean;
  attachmentHelpText?: TranslatableString | null; // MODIFICADO
  remindersConfig?: Record<string, any> | null;
  notificationsConfig?: Record<string, any> | null;
  acl?: Record<string, any> | null;

  // Seus campos
  requiresApproval?: boolean;
  allowTranslations?: boolean;
  defaultLocale?: string | null;

  fields: CreateFormFieldDto[];
}