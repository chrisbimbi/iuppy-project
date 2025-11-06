// backend/src/modules/forms/dto/respond.dto.ts
export interface RespondDto {
  type: 'reply'|'approve'|'reject'
  message?: string
}
