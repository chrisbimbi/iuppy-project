
import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
    className: string
    stats: {
        self: { total: number; submitted: number }
        manager: { total: number; submitted: number }
    }
}

export const PerformancePulseWidget: React.FC<Props> = ({ className, stats }) => {
    const getPercent = (submitted: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((submitted / total) * 100);
    };

    const selfPercent = getPercent(stats.self.submitted, stats.self.total);
    const managerPercent = getPercent(stats.manager.submitted, stats.manager.total);

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Pulso do Ciclo</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Acompanhamento em Tempo Real</span>
                </h3>
                <div className='card-toolbar'>
                    <Link to='/performance' className='btn btn-sm btn-light btn-active-light-primary'>
                        Detalhes
                    </Link>
                </div>
            </div>
            <div className='card-body'>
                {/* Self Assessments */}
                <div className='d-flex flex-column mb-9'>
                    <div className='d-flex align-items-center mb-2'>
                        <span className='text-gray-700 fs-6 fw-bold me-2'>Autoavaliações</span>
                        <span className='text-muted fs-7'>({stats.self.submitted}/{stats.self.total})</span>
                        <span className='fw-bold ms-auto'>{selfPercent}%</span>
                    </div>
                    <div className='h-5px mx-3 w-100 bg-light mb-3'>
                        <div
                            className='bg-success rounded h-5px'
                            role='progressbar'
                            style={{ width: `${selfPercent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Manager Assessments */}
                <div className='d-flex flex-column'>
                    <div className='d-flex align-items-center mb-2'>
                        <span className='text-gray-700 fs-6 fw-bold me-2'>Avaliações de Gestor</span>
                        <span className='text-muted fs-7'>({stats.manager.submitted}/{stats.manager.total})</span>
                        <span className='fw-bold ms-auto'>{managerPercent}%</span>
                    </div>
                    <div className='h-5px mx-3 w-100 bg-light mb-3'>
                        <div
                            className='bg-primary rounded h-5px'
                            role='progressbar'
                            style={{ width: `${managerPercent}%` }}
                        ></div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <button className="btn btn-sm btn-light-warning">
                        <i className="bi bi-bell me-2"></i> Cobrar Pendentes
                    </button>
                </div>
            </div>
        </div>
    )
}
