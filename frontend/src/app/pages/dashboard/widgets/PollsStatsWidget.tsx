import React from 'react'

type Props = {
    className?: string
    stats: {
        totalPolls: number
        totalResponses: number
        avgParticipationPercent: number
        recentPolls: Array<{
            id: string
            title: string
            status: string
            responses: number
            createdAt: string
        }>
    }
}

export const PollsStatsWidget: React.FC<Props> = ({ className, stats }) => {
    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Clima & Enquetes</span>
                    <span className='text-muted fw-bold fs-7'>Escutando a opinião dos colaboradores</span>
                </h3>
            </div>
            <div className='card-body py-3'>
                <div className='d-flex align-items-center mb-6'>
                    <div className='symbol symbol-50px me-5'>
                        <div className='symbol-label bg-light-info'>
                            <i className='bi bi-megaphone-fill text-info fs-2x'></i>
                        </div>
                    </div>
                    <div className='d-flex flex-column'>
                        <span className='text-dark fw-bold fs-2hx'>{stats.avgParticipationPercent}%</span>
                        <span className='text-muted fw-semibold fs-7'>Engajamento Médio em Enquetes</span>
                    </div>
                </div>

                <div className='separator separator-dashed my-4'></div>

                <div className='mb-5'>
                    <span className='text-gray-800 fw-bold fs-6 d-block mb-3'>Últimas Campanhas</span>
                    {stats.recentPolls?.map((poll, i) => (
                        <div key={poll.id || i} className='d-flex align-items-center mb-3'>
                            <div className='bullet bullet-vertical h-30px bg-info me-3'></div>
                            <div className='flex-grow-1'>
                                <span className='text-gray-800 fw-bold text-hover-primary mb-1 fs-6'>
                                    {poll.title}
                                </span>
                                <div className='text-muted fw-semibold fs-7'>{poll.responses} participações</div>
                            </div>
                            <span className='badge badge-light-success fs-8 fw-bold'>
                                {poll.status === 'published' ? 'Ativa' : 'Finalizada'}
                            </span>
                        </div>
                    ))}
                    {(!stats.recentPolls || stats.recentPolls.length === 0) && (
                        <div className='text-muted fs-7'>Nenhuma enquete ativa no momento.</div>
                    )}
                </div>

                <div className='d-flex flex-stack bg-light-info rounded p-4 mt-auto'>
                    <div className='d-flex flex-column'>
                        <span className='fs-7 fw-bold text-info'>{stats.totalResponses}</span>
                        <span className='fw-semibold text-gray-600 fs-8'>Total de Respostas</span>
                    </div>
                    <div className='d-flex flex-column align-items-end'>
                        <span className='fs-7 fw-bold text-info'>{stats.totalPolls}</span>
                        <span className='fw-semibold text-gray-600 fs-8'>Enquetes Totais</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
