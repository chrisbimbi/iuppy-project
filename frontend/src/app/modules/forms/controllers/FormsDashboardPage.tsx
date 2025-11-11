// modules/forms/controllers/FormsDashboardPage.tsx
import React from 'react'
import { FormsApi } from '../services/api'

export default function FormsDashboardPage() {
  const [overview, setOverview] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)
  const [err, setErr] = React.useState<string | null>(null)

  React.useEffect(() => {
    FormsApi.analyticsOverview()
      .then(setOverview)
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="card">
        <div className="card-body">Carregando...</div>
      </div>
    )

  if (err)
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger mb-0">{err}</div>
        </div>
      </div>
    )

  // backend: {
  //  totalForms,
  //  totalQuestions,
  //  totalSubmissions,
  //  backlog,
  //  onTimeRate,
  //  externalRate,
  //  rhResponseRate,
  //  series,
  //  topForms,
  //  topSpaces,
  // }

  return (
    <div className="row g-5 g-xl-8">
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <span className="fw-bold fs-6 text-gray-800 d-block mb-2">
              Total de formulários
            </span>
            <span className="fw-bolder fs-2x text-dark">
              {overview?.totalForms ?? 0}
            </span>
          </div>
        </div>
      </div>
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <span className="fw-bold fs-6 text-gray-800 d-block mb-2">
              Submissões (todas)
            </span>
            <span className="fw-bolder fs-2x text-dark">
              {overview?.totalSubmissions ?? 0}
            </span>
          </div>
        </div>
      </div>
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <span className="fw-bold fs-6 text-gray-800 d-block mb-2">% no prazo</span>
            <span className="fw-bolder fs-2x text-dark">
              {overview?.onTimeRate
                ? Math.round(overview.onTimeRate * 100) + '%'
                : '0%'}
            </span>
          </div>
        </div>
      </div>
      <div className="col-xl-3">
        <div className="card card-xl-stretch mb-xl-8">
          <div className="card-body">
            <span className="fw-bold fs-6 text-gray-800 d-block mb-2">
              Pendentes p/ RH
            </span>
            <span className="fw-bolder fs-2x text-dark">
              {overview?.backlog ?? 0}
            </span>
          </div>
        </div>
      </div>

      <div className="col-xl-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top formulários</h3>
          </div>
          <div className="card-body py-3">
            <table className="table align-middle gs-0 gy-3">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Envios</th>
                </tr>
              </thead>
              <tbody>
                {(overview?.topForms ?? []).map((it: any) => (
                  <tr key={it.formId}>
                    <td>{it.title ?? it.formId}</td>
                    <td>{it.submissions}</td>
                  </tr>
                ))}
                {(overview?.topForms ?? []).length === 0 && (
                  <tr>
                    <td colSpan={2} className="text-muted">
                      Nenhum formulário com envios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}