// backend/src/modules/forms/dto/create-submission.dto.ts

export interface CreateSubmissionDto {
  external?: boolean;
  externalEmail?: string | null;
  answers?: Array<{
    fieldId: string;
    type?: string;
    value: any;
  }>;
  attachments?: Array<{
    storagePath: string;
    mimeType?: string;
    bytes?: number;
  }>;
  meta?: any;
  spaceIds?: string[];
  groupIds?: string[];
}
