import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'

type ListQueryDto = {
  from: string
  to: string
  timezone?: string
  page?: number
  pageSize?: number
  status?: string
}

type ExportBodyDto = {
  format?: 'csv'
  from: string
  to: string
  formIds?: string[]
}

@Injectable()
export class FormsAnalyticsV2Service {
  constructor(private readonly ds: DataSource) {}

  private dateOnly(d: string) {
    return d?.slice(0, 10)
  }

  async list(companyId: string, q: ListQueryDto) {
    const from = this.dateOnly(q.from)
    const to = this.dateOnly(q.to)
    const page = Number(q.page || 1)
    const pageSize = Math.min(Number(q.pageSize || 25), 100)

    const params: any[] = [companyId, from, to]
    const statusFilter = q.status ? 'AND f.status = $4' : ''
    if (q.status) params.push(q.status)

    const items = await this.ds.query(
      `SELECT f.id as "formId", f.title, f.status, f."deadlineAt",
              COALESCE(SUM(d.opens),0) as opens,
              COALESCE(SUM(d.starts),0) as starts,
              COALESCE(SUM(d.submits),0) as submits,
              CASE WHEN COALESCE(SUM(d.opens),0)>0 THEN ROUND(COALESCE(SUM(d.submits),0)::numeric / NULLIF(SUM(d.opens),0), 3) ELSE 0 END as completion,
              CASE WHEN COALESCE(SUM(d.eligibles),0)>0 THEN ROUND(COALESCE(SUM(d.submits),0)::numeric / NULLIF(SUM(d.eligibles),0), 3) ELSE 0 END as conversion,
              CASE WHEN COALESCE(SUM(d.submits),0)>0 THEN ROUND(COALESCE(SUM(d."onTimeSubmits"),0)::numeric / NULLIF(SUM(d.submits),0), 3) ELSE 0 END as "onTimeRate"
         FROM form f
         LEFT JOIN form_metrics_daily d ON d."companyId"=$1 AND d."formId"=f.id AND d."date">=$2 AND d."date"<$3
        WHERE f."companyId"=$1 ${statusFilter}
        GROUP BY 1,2,3,4
        ORDER BY submits DESC, opens DESC
        LIMIT ${pageSize} OFFSET ${(page-1)*pageSize}`,
      params,
    )

    const totalRow = await this.ds.query(
      `SELECT COUNT(*) FROM form f WHERE f."companyId"=$1 ${statusFilter}`,
      params.slice(0, q.status ? 4 : 3),
    )
    const total = Number(totalRow?.[0]?.count || 0)

    return { total, page, pageSize, items }
  }

  async submissions(companyId: string, formId: string, from: string, to: string, page: number, pageSize: number) {
    const items = await this.ds.query(
      `SELECT s.id AS "submissionId", s."submittedAt", s.status, s."isOnTime", s.external, s."externalEmail", s."fileCount",
              s."userId"
         FROM form_submission s
        WHERE s."companyId"=$1 AND s."formId"=$2
          AND s."submittedAt">=$3 AND s."submittedAt"<$4
        ORDER BY s."submittedAt" DESC
        LIMIT ${pageSize} OFFSET ${(page-1)*pageSize}`,
      [companyId, formId, from, to],
    )
    const totalRow = await this.ds.query(
      `SELECT COUNT(*) FROM form_submission s WHERE s."companyId"=$1 AND s."formId"=$2 AND s."submittedAt">=$3 AND s."submittedAt"<$4`,
      [companyId, formId, from, to],
    )
    const total = Number(totalRow?.[0]?.count || 0)
    return { total, page, pageSize, items }
  }

  private escapeCsvCell(s: any): string {
    if (s === null || s === undefined) return ''
    const str = typeof s === 'string' ? s : JSON.stringify(s)
    if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"'
    return str
  }

  async exportCsv(companyId: string, body: ExportBodyDto): Promise<string> {
    const from = body.from.slice(0,10)
    const to = body.to.slice(0,10)

    const hasFormFilter = Array.isArray(body.formIds) && body.formIds.length > 0
    const formFilter = hasFormFilter ? 'AND s."formId" = ANY($4)' : ''
    const params = hasFormFilter ? [companyId, from, to, body.formIds] : [companyId, from, to]

    const rows = await this.ds.query(
      `SELECT s.id AS "submissionId", s."formId", s."submittedAt", s.status, s."isOnTime", s.external, s."externalEmail", s."fileCount", s."userId",
              a."fieldId", a.type, a.value
         FROM form_submission s
         LEFT JOIN form_answer a ON a."companyId"=s."companyId" AND a."submissionId"=s.id
        WHERE s."companyId"=$1 AND s."submittedAt">=$2 AND s."submittedAt"<$3
          ${formFilter}
        ORDER BY s."submittedAt" ASC`,
      params,
    )

    const headers = ["submissionId","formId","submittedAt","status","isOnTime","external","externalEmail","fileCount","userId","fieldId","type","value"]
    let csv = headers.join(",") + "\n"
    for (const row of rows) {
      const line = headers.map(h => this.escapeCsvCell(row[h])).join(",")
      csv += line + "\n"
    }
    return csv
  }
}