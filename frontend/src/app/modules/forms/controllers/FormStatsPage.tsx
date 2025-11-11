// modules/forms/controllers/FormStatsPage.tsx
import React from 'react'
import { useParams } from 'react-router-dom'
import { FormsApi } from '../services/api'
import { Card, Spinner } from 'react-bootstrap'

export default function FormStatsPage() {
  const { formId } = useParams<{ formId: string }>()
  const [loading, setLoading] = React.useState(true)
  const [data, setData] = React.useState<any>(null)
  const [err, setErr] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!formId) return
    let mounted = true
    setLoading(true)
    setErr(null)
    FormsApi.analyticsStats(formId, {})
      .then((res) => {
        if (!mounted) return
        setData(res)
      })
      .catch((e) => {
        if (!mounted) return
        setErr(String(e?.message || e))
      })
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [formId])

  if (loading) {
    return (
      <div className="p-6 d-flex align-items-center gap-2">
        <Spinner animation="border" size="sm" />
        <span>Carregando estatísticas…</span>
      </div>
    )
  }

  if (err) {
    return <div className="p-6 alert alert-danger mb-0">{err}</div>
  }

  if (!data) {
    return <div className="p-6">Sem dados para esse formulário.</div>
  }

  // backend (controller):
  // {
  //   kpis: { total, external, withFiles, rh },
  //   activity,
  //   reminders,
  //   spaces,
  //   groups
  // }

  const kpis = data.kpis || {}
  const activity = data.activity || []
  const spaces = data.spaces || []
  const groups = data.groups || []

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold mb-3">
        Estatísticas do formulário
      </h1>

      <div className="d-flex flex-wrap gap-3 mb-4">
        <Card style={{ minWidth: 180 }}>
          <Card.Body>
            <div className="text-muted small">Submissões</div>
            <div className="fs-4 fw-semibold">{kpis.total ?? 0}</div>
          </Card.Body>
        </Card>
        <Card style={{ minWidth: 180 }}>
          <Card.Body>
            <div className="text-muted small">Externas</div>
            <div className="fs-4 fw-semibold">{kpis.external ?? 0}</div>
          </Card.Body>
        </Card>
        <Card style={{ minWidth: 180 }}>
          <Card.Body>
            <div className="text-muted small">Com anexos</div>
            <div className="fs-4 fw-semibold">{kpis.withFiles ?? 0}</div>
          </Card.Body>
        </Card>
        <Card style={{ minWidth: 180 }}>
          <Card.Body>
            <div className="text-muted small">Com ação do RH</div>
            <div className="fs-4 fw-semibold">{kpis.rh ?? 0}</div>
          </Card.Body>
        </Card>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <Card>
            <Card.Header>Atividade (últimos envios)</Card.Header>
            <Card.Body>
              {activity.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {activity.map((it: any, idx: number) => (
                    <li key={idx} className="d-flex justify-content-between">
                      <span>{it.d ?? it.date ?? '-'}</span>
                      <span>{it.submissions ?? 0} envios</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted small">Sem dados.</div>
              )}
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-6">
          <Card>
            <Card.Header>Por espaço</Card.Header>
            <Card.Body>
              {spaces.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {spaces.map((it: any, idx: number) => (
                    <li key={idx} className="d-flex justify-content-between">
                      <span>{it.name ?? it.spaceId}</span>
                      <span>{it.submissions} envios</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted small">Sem dados.</div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      <div className="row g-3 mt-1">
        <div className="col-md-6">
          <Card>
            <Card.Header>Por grupo</Card.Header>
            <Card.Body>
              {groups.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {groups.map((it: any, idx: number) => (
                    <li key={idx} className="d-flex justify-content-between">
                      <span>{it.name ?? it.groupId}</span>
                      <span>{it.submissions} envios</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted small">Sem dados.</div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}