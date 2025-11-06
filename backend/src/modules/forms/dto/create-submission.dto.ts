// backend/src/modules/forms/dto/create-submission.dto.ts
export interface CreateSubmissionDto {
  answers: Array<{
    fieldId: string
    type: string
    value: any
  }>
  meta?: Record<string, any>
  attachments?: Array<{
    storagePath: string
    mimeType: string
    bytes: number
  }>
  external?: boolean
  externalEmail?: string | null
  spaceIds?: string[]
  groupIds?: string[]
}
