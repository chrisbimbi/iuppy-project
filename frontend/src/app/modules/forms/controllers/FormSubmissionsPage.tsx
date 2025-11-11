// modules/forms/controllers/FormSubmissionsPage.tsx
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FormsApi } from '../services/api'
import { Button, Modal } from 'react-bootstrap'

type SubmissionItem = {
  submissionId: string
  submittedAt: string
  status?: string
  isOnTime?: boolean
  attachments?: Array<{
    id: string
    filename: string
    url?: string
  }>
}

export default function FormSubmissionsPage() {
  const { formId } = useParams()
  const nav = useNavigate()
  const [data, setData] = React.useState<any>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 50,
  })
  const [form, setForm] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const [showAttachments, setShowAttachments] = React.useState(false)
  const [currentAttachments, setCurrentAttachments] = React.useState<
    SubmissionItem['attachments']
  >([])

  const openAttachments = (attachments?: SubmissionItem['attachments']) => {
    setCurrentAttachments(attachments ?? [])
    setShowAttachments(true)
  }

  const closeAttachments = () => {
    setShowAttachments(false)
    setCurrentAttachments([])
  }

  const load = async () => {
    if (!formId) return
    setLoading(true)
    try {
      const [f, s] = await Promise.all([
        FormsApi.get(formId),
        FormsApi.submissions(formId, { page: 1, pageSize: 50 }),
      ])
      setForm(f)
      setData(s)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [formId])

  const act = async (sid: string, type: 'reply' | 'approve' | 'reject') => {
    if (!formId) return
    await FormsApi.respond(formId, sid, { type })
    await load()
  }

  if (loading) return <div className="p-6">Carregando…</div>

  return (
    <div className="p-4 space-y-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="text-2xl font-semibold mb-0">Submissões · {form?.title}</h1>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => nav(`/forms/${formId}/stats`)}>
            Ver estatísticas
          </Button>
          <Button variant="outline-primary" onClick={load}>
            Recarregar
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {data.items.map((it: SubmissionItem & any) => (
          <div
            key={it.submissionId}
            className="p-3 border rounded d-flex align-items-center justify-content-between"
          >
            <div>
              <div className="fw-medium">{it.userName ? it.userName : it.submissionId}</div>
              <div className="text-muted small">
                {it.submittedAt ? new Date(it.submittedAt).toLocaleString() : '—'}
              </div>
              <div className="small">
                Status: {it.status ?? '-'} {it.isOnTime ? '· no prazo' : ''}
              </div>
              {it.attachments && it.attachments.length > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm ps-0"
                  onClick={() => openAttachments(it.attachments)}
                >
                  Ver anexos ({it.attachments.length})
                </button>
              )}
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline" onClick={() => act(it.submissionId, 'reply')}>
                Responder
              </Button>
              {form?.requiresApproval && (
                <>
                  <Button variant="outline" onClick={() => act(it.submissionId, 'approve')}>
                    Aprovar
                  </Button>
                  <Button variant="danger" onClick={() => act(it.submissionId, 'reject')}>
                    Reprovar
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal show={showAttachments} onHide={closeAttachments} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Anexos da submissão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(!currentAttachments || currentAttachments.length === 0) && (
            <div className="text-muted">Nenhum anexo encontrado.</div>
          )}
          {currentAttachments && currentAttachments.length > 0 && (
            <ul className="list-group">
              {currentAttachments.map((att) => (
                <li key={att.id} className="list-group-item d-flex justify-content-between">
                  <span>{att.filename}</span>
                  {att.url ? (
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-link"
                    >
                      Abrir
                    </a>
                  ) : (
                    <span className="text-muted small">sem URL (assinar no backend)</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeAttachments}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
