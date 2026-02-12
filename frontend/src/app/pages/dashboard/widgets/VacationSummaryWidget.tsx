
import React from 'react'
import { Link } from 'react-router-dom'

type Props = {
    className: string
    stats: {
        awayNow: number
        pendingRequests: number
        awayUsersList?: { id: string; name: string; avatar?: string; endDate: string }[]
    }
}

export const VacationSummaryWidget: React.FC<Props> = ({ className, stats }) => {
    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Resumo de Férias</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Visão Geral Operacional</span>
                </h3>
                <div className='card-toolbar'>
                    <Link to='/vacations/requests' className='btn btn-sm btn-light-primary'>
                        Gerenciar
                    </Link>
                </div>
            </div>
            <div className='card-body py-3'>
                {/* Pending Requests Alert */}
                {stats.pendingRequests > 0 && (
                    <div className="alert alert-warning d-flex align-items-center p-5 mb-5">
                        <i className="bi bi-exclamation-triangle-fill fs-2hx text-warning me-4"></i>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-warning">Atenção Necessária</h4>
                            <span>Você tem <strong>{stats.pendingRequests}</strong> solicitações pendentes de aprovação.</span>
                        </div>
                    </div>
                )}

                {/* Away Now List */}
                <div className='mb-5'>
                    <div className='d-flex align-items-center mb-3'>
                        <span className='fs-5 fw-bold text-gray-800 me-2'>Ausentes Agora ({stats.awayNow})</span>
                        <span className='badge badge-light-success fs-7'>Em Férias</span>
                    </div>

                    {stats.awayUsersList && stats.awayUsersList.length > 0 ? (
                        <div className='symbol-group symbol-hover'>
                            {stats.awayUsersList.map((user) => (
                                <div className='symbol symbol-35px symbol-circle' key={user.id} title={`${user.name} (até ${new Date(user.endDate).toLocaleDateString('pt-BR')})`}>
                                    {user.avatar ? (
                                        <img alt={user.name} src={user.avatar} />
                                    ) : (
                                        <span className='symbol-label bg-warning text-inverse-warning fw-bold'>{user.name.charAt(0)}</span>
                                    )}
                                </div>
                            ))}
                            {stats.awayNow > 5 && (
                                <Link to='/vacations' className='symbol symbol-35px symbol-circle'>
                                    <span className='symbol-label bg-light-primary text-primary fs-8 fw-bold'>+{stats.awayNow - 5}</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className='text-gray-500 fs-7'>Ninguém de férias no momento.</div>
                    )}
                </div>

                {/* Quick Link to Policy or Balance */}
                <div className='d-flex align-items-center'>
                    {/* Can add expiring soon here if data provided */}
                </div>
            </div>
        </div>
    )
}
