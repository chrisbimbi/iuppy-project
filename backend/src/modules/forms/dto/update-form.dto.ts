// src/forms/dto/update-form.dto.ts
import type { FormStatus, TranslatableString } from '../entities/form.entity'; // Importa o novo tipo
import type { FormFieldType } from '../entities/form-field.entity';

export interface UpdateFormFieldDto {
  type: FormFieldType;
  label: TranslatableString; // MODIFICADO
  required?: boolean;
  options?: Record<string, any> | null;
  order?: number;
}

export interface UpdateFormDto {
  title?: TranslatableString; // MODIFICADO
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

  requiresApproval?: boolean;
  allowTranslations?: boolean;
  defaultLocale?: string | null;
  visibility?: 'public' | 'private' | 'specific_groups' | 'journey_only';

  fields?: UpdateFormFieldDto[];
}
