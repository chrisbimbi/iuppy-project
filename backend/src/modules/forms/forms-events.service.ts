// src/modules/forms/forms-events.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export type FormEventType =
  | 'form_impression'
  | 'form_open'
  | 'form_start'
  | 'form_submit_success'
  | 'form_submit_fail'
  | 'form_view_submission'
  | 'attachment_upload_success'
  | 'attachment_upload_fail';

@Injectable()
export class FormsEventsService {
  constructor(private readonly ds: DataSource) {}

  async insertEvent(params: {
    companyId: string;
    formId: string;
    type: FormEventType;
    userId?: string | null;
    external?: boolean;
    externalEmail?: string | null;
    fieldId?: string | null;
    meta?: any;
    ts?: Date;
  }) {
    const {
      companyId,
      formId,
      type,
      userId = null,
      external = false,
      externalEmail = null,
      fieldId = null,
      meta = null,
      ts = new Date(),
    } = params;

    await this.ds.query(
      `INSERT INTO form_event
       ("companyId","formId","type","userId","external","externalEmail","fieldId","meta","ts")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        companyId,
        formId,
        type,
        userId,
        external,
        externalEmail,
        fieldId,
        meta,
        ts,
      ],
    );
  }
}
