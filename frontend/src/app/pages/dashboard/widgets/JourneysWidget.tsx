
import React from 'react'

type Props = {
    className: string
    stats: {
        activeJourneys: number
        totalInstances: number
        startedInstances?: number
        completedInstances: number
        advancing?: number
        behind?: number
        avgCompletionPercent?: number
        avgVideoViews?: number
        topJourneys: Array<{ id: string; title: string; enrollments: number }>
    }
}

const JourneysWidget: React.FC<Props> = ({ className, stats }) => {
    const completionRate = stats.avgCompletionPercent !== undefined ? stats.avgCompletionPercent : 0
    const advancing = stats.advancing || 0
    const behind = stats.behind || 0
    const avgVideoViews = stats.avgVideoViews || 0

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Jornadas & Onboarding</span>
                    <span className='text-muted fw-bold fs-7'>Acompanhamento de progresso e engajamento</span>
                </h3>
            </div>
            <div className='card-body py-3'>
                {/* Advanced Metrics Row */}
                <div className='row g-4 mb-4'>
                    <div className='col-6'>
                        <div className='bg-light-success rounded p-4'>
                            <div className='fs-2 fw-bolder text-success'>{advancing}</div>
                            <div className='fw-bold text-gray-600 fs-8'>No Prazo</div>
                        </div>
                    </div>
                    <div className='col-6'>
                        <div className='bg-light-danger rounded p-4'>
                            <div className='fs-2 fw-bolder text-danger'>{behind}</div>
                            <div className='fw-bold text-gray-600 fs-8'>Atrasados</div>
                        </div>
                    </div>
                </div>

                <div className='d-flex align-items-center bg-light-primary rounded p-4 mb-3'>
                    <div className='flex-grow-1'>
                        <div className='fs-2 fw-bold text-primary'>{completionRate}%</div>
                        <div className='fw-semibold text-gray-600 fs-7'>Conclusão Média</div>
                    </div>
                    <div className='flex-grow-1 border-start ps-4'>
                        <div className='fs-2 fw-bold text-dark'>{avgVideoViews}</div>
                        <div className='fw-semibold text-gray-600 fs-7'>Média de Vídeos</div>
                    </div>
                </div>

                <div className='fw-bold text-muted mb-2'>Top Jornadas (Inscrições)</div>
                <div className='d-flex flex-column'>
                    {stats.topJourneys?.map((j, i) => (
                        <div key={i} className='d-flex align-items-center mb-2'>
                            <span className='bullet bullet-vertical h-20px bg-success me-3'></span>
                            <div className='flex-grow-1 text-gray-800 fw-bold fs-6'>{j.title}</div>
                            <span className='text-muted fw-bold fs-7'>{j.enrollments}</span>
                        </div>
                    ))}
                    {(!stats.topJourneys || stats.topJourneys.length === 0) && (
                        <span className='text-gray-400 fs-7'>Sem dados.</span>
                    )}
                </div>
            </div>
        </div>
    )
}

export { JourneysWidget }
