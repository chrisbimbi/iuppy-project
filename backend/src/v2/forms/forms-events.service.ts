import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

export type FormEventType =
  | 'form_impression' | 'form_open' | 'form_start'
  | 'form_save_draft'
  | 'field_focus' | 'field_change' | 'field_validation_error'
  | 'attachment_upload_start' | 'attachment_upload_success' | 'attachment_upload_fail'
  | 'form_submit_attempt' | 'form_submit_success' | 'form_submit_fail'
  | 'form_view_submission'

@Injectable()
export class FormsEventsService {
  constructor(private readonly ds: DataSource) {}

  async insertEvent(params: {
    companyId: string
    formId: string
    userId?: string | null
    external?: boolean
    externalEmail?: string | null
    type: FormEventType
    fieldId?: string | null
    meta?: any
    ts?: Date
  }) {
    const {
      companyId, formId, userId = null, external = false, externalEmail = null,
      type, fieldId = null, meta = null, ts = new Date(),
    } = params

    await this.ds.query(
      `INSERT INTO form_event ("companyId","formId","type","userId","external","externalEmail","fieldId","meta","ts")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [companyId, formId, type, userId, external, externalEmail, fieldId, meta, ts],
    )
  }
}