import React from 'react'

type Props = {
    stats: {
        risks: { total: number; high: number; medium: number; low: number }
        training: { total: number; completed: number; overdue: number; completionRate: number }
        drills: { total: number; participated: number }
        eSocial: { pendingEvents: number; lastSync: string | null }
        documents: number
        checklists: number
    }
}

export const Nr1StatsWidget: React.FC<Props> = ({ stats }) => {
    // Derived metrics
    const participationRate = stats.drills.total > 0
        ? Math.round((stats.drills.participated / stats.drills.total) * 100)
        : 0;

    // Average score not present, using default or hidden
    const averageScore = '-';

    return (
        <div className='card card-xl-stretch mb-xl-8'>
            <div className='card-header border-0 py-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>NR-1 Hub</span>
                    <span className='text-muted fw-bold fs-7'>Status de Conformidade</span>
                </h3>
            </div>
            <div className='card-body py-3'>
                <div className='row g-5'>
                    {/* PGR */}
                    <div className='col-md-6 col-lg-4'>
                        <div className='bg-light-danger rounded p-4 mb-4'>
                            <div className="d-flex align-items-center mb-2">
                                <span className="svg-icon svg-icon-2 svg-icon-danger me-2">⚠️</span>
                                <div className="fw-bolder fs-6 text-gray-800">PGR (Riscos)</div>
                            </div>
                            <div className="fs-2x fw-bolder text-danger mb-1">{stats.risks.high}</div>
                            <div className="fs-7 text-muted fw-bold">Riscos Críticos de {stats.risks.total}</div>
                            <div className="mt-3">
                                <div className="d-flex justify-content-between fw-bolder fs-7 text-gray-600 mb-1">
                                    <span>Risco Médio</span>
                                    <span>{stats.risks.medium}</span>
                                </div>
                                <div className="d-flex justify-content-between fw-bolder fs-7 text-gray-600 mb-1">
                                    <span>Risco Baixo</span>
                                    <span>{stats.risks.low}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trainings */}
                    <div className='col-md-6 col-lg-4'>
                        <div className='bg-light-primary rounded p-4 mb-4'>
                            <div className="d-flex align-items-center mb-2">
                                <span className="svg-icon svg-icon-2 svg-icon-primary me-2">🎓</span>
                                <div className="fw-bolder fs-6 text-gray-800">Treinamentos</div>
                            </div>
                            <div className="fs-2x fw-bolder text-primary mb-1">{stats.training.completionRate}%</div>
                            <div className="fs-7 text-muted fw-bold">Taxa de Conclusão</div>
                            <div className="d-flex justify-content-between mt-3 text-muted fs-7 fw-bold">
                                <span>Concluídos: {stats.training.completed}</span>
                                <span>Total: {stats.training.total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Drills */}
                    <div className='col-md-6 col-lg-4'>
                        <div className='bg-light-warning rounded p-4 mb-4'>
                            <div className="d-flex align-items-center mb-2">
                                <span className="svg-icon svg-icon-2 svg-icon-warning me-2">🔥</span>
                                <div className="fw-bolder fs-6 text-gray-800">Simulados</div>
                            </div>
                            <div className="fs-2x fw-bolder text-warning mb-1">{participationRate}%</div>
                            <div className="fs-7 text-muted fw-bold">Participação</div>
                            <div className="mt-3 fs-7 fw-bold text-muted">
                                Realizados: {stats.drills.total}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="separator my-5"></div>

                <div className="row">
                    <div className="col">
                        <div className="d-flex align-items-center border border-gray-300 border-dashed rounded p-3">
                            <div className="fs-3 fw-bolder text-gray-900 me-2">{stats.documents}</div>
                            <div className="fw-bold text-gray-400 fs-7">Documentos</div>
                        </div>
                    </div>
                    <div className="col">
                        <div className="d-flex align-items-center border border-gray-300 border-dashed rounded p-3">
                            <div className="fs-3 fw-bolder text-gray-900 me-2">{stats.checklists}</div>
                            <div className="fw-bold text-gray-400 fs-7">Checklists</div>
                        </div>
                    </div>
                    <div className="col">
                        <div className="d-flex align-items-center border border-gray-300 border-dashed rounded p-3">
                            <div className="fs-3 fw-bolder text-gray-900 me-2">{stats.eSocial.pendingEvents}</div>
                            <div className="fw-bold text-gray-400 fs-7">Pend. eSocial</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
