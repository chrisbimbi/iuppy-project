// frontend/src/app/modules/forms/controllers/FormSubmissionsPage.tsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { FormsApi } from '../services/api'
import { Button } from 'react-bootstrap'

export default function FormSubmissionsPage() {
  const { formId } = useParams()
  const [data, setData] = React.useState<any>({ items: [], total: 0, page: 1, pageSize: 50 })
  const [form, setForm] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [f, s] = await Promise.all([
        FormsApi.get(formId!),
        FormsApi.submissions(formId!, { page: 1, pageSize: 50 }),
      ])
      setForm(f)
      setData(s)
    } finally { setLoading(false) }
  }

  React.useEffect(() => { load() }, [formId])

  const act = async (sid: string, type: 'reply'|'approve'|'reject') => {
    await FormsApi.respond(formId!, sid, { type })
    await load()
  }

  if (loading) return <div className="p-6">Carregando…</div>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Submissões · {form?.title}</h1>
      <div className="grid gap-3">
        {data.items.map((it: any) => (
          <div key={it.submissionId} className="p-3 border rounded d-flex align-items-center justify-content-between">
            <div>
              <div className="fw-medium">{it.submissionId}</div>
              <div className="text-muted small">{new Date(it.submittedAt).toLocaleString()}</div>
              <div className="small">Status: {it.status} {it.isOnTime ? '· no prazo' : ''}</div>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline" onClick={() => act(it.submissionId, 'reply')}>Responder</Button>
              {form?.requiresApproval && (
                <>
                  <Button variant="outline" onClick={() => act(it.submissionId, 'approve')}>Aprovar</Button>
                  <Button variant="danger" onClick={() => act(it.submissionId, 'reject')}>Reprovar</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}