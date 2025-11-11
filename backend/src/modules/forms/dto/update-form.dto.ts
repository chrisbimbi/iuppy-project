// backend/src/modules/forms/dto/update-form.dto.ts
import type { FormStatus } from '../entities/form.entity';
import type { FormFieldType } from '../entities/form-field.entity';

export interface UpdateFormFieldDto {
  type: FormFieldType;
  label: string;
  required?: boolean;
  options?: Record<string, any> | null;
  order?: number;
}

export interface UpdateFormDto {
  title?: string;
  description?: string;
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
  attachmentHelpText?: string | null;

  remindersConfig?: Record<string, any> | null;
  notificationsConfig?: Record<string, any> | null;
  acl?: Record<string, any> | null;

  requiresApproval?: boolean;
  allowTranslations?: boolean;
  defaultLocale?: string | null;

  // se vier, recria versão de campos
  fields?: UpdateFormFieldDto[];
}
