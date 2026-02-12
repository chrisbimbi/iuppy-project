
import React from 'react'
import { Link } from 'react-router-dom'

type ActionItem = {
    title: string
    count: number
    link: string
    icon: string
    color: string
}

type Props = {
    className: string
    actions: ActionItem[]
}

export const HRActionsWidget: React.FC<Props> = ({ className, actions }) => {
    // Filter only actions with count > 0 to declutter
    const activeActions = actions.filter(a => a.count > 0);

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Central de Ações</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Pendências e Tarefas</span>
                </h3>
            </div>
            <div className='card-body pt-2'>
                {activeActions.length === 0 ? (
                    <div className='d-flex flex-column align-items-center justify-content-center h-100'>
                        <i className='bi bi-check-circle-fill fs-3x text-success mb-3'></i>
                        <span className='text-gray-500 fw-bold'>Tudo em dia! Nenhuma pendência.</span>
                    </div>
                ) : (
                    <div className='d-flex flex-column'>
                        {activeActions.map((action, idx) => (
                            <Link to={action.link} key={idx} className={`d-flex align-items-center bg-light-${action.color} rounded p-4 mb-4 text-decoration-none`}>
                                <div className='symbol symbol-30px me-4'>
                                    <div className={`symbol-label bg-${action.color}`}>
                                        <i className={`bi ${action.icon} text-white fs-6`}></i>
                                    </div>
                                </div>
                                <div className='flex-grow-1 me-2'>
                                    <span className='fw-bold text-gray-800 fs-7'>{action.title}</span>
                                    {/* <span className='text-muted fw-semibold d-block fs-9'>Ação requerida</span> */}
                                </div>
                                <span className={`badge badge-${action.color} fs-7 fw-bold`}>{action.count}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
