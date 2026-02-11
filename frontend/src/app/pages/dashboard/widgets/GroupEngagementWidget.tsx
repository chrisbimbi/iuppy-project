import React from 'react'
import { KTSVG } from '../../../../helpers'

type Props = {
    className: string
    topGroups: Array<{ groupName: string, count: number }>
    bottomGroups: Array<{ groupName: string, count: number }>
}

const GroupEngagementWidget: React.FC<Props> = ({ className, topGroups, bottomGroups }) => {
    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Engajamento por Times/Grupos</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Cultura e Colaboração</span>
                </h3>
            </div>
            <div className='card-body py-3'>
                <div className='row'>
                    <div className='col-md-6 border-end'>
                        <h4 className='text-success mb-4 fs-6 text-uppercase fw-bold'>
                            <span className="bullet bullet-dot bg-success h-10px w-10px me-2"></span>
                            Mais Engajados
                        </h4>
                        {/* Top List */}
                        <div className='table-responsive'>
                            <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
                                <tbody>
                                    {topGroups?.map((g, i) => (
                                        <tr key={i}>
                                            <td className='fw-bold text-gray-600 text-start'>{i + 1}. {g.groupName || 'Geral'}</td>
                                            <td className='text-end'>
                                                <span className='badge badge-light-success'>{g.count} interações</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!topGroups || topGroups.length === 0) && <tr><td className='text-muted'>Sem dados</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className='col-md-6 ps-md-5'>
                        <h4 className='text-danger mb-4 fs-6 text-uppercase fw-bold'>
                            <span className="bullet bullet-dot bg-danger h-10px w-10px me-2"></span>
                            Menos Engajados (Alerta)
                        </h4>
                        {/* Bottom List */}
                        <div className='table-responsive'>
                            <table className='table table-row-dashed table-row-gray-200 align-middle gs-0 gy-3'>
                                <tbody>
                                    {bottomGroups?.map((g, i) => (
                                        <tr key={i}>
                                            <td className='fw-bold text-gray-600 text-start'>{g.groupName || 'Geral'}</td>
                                            <td className='text-end'>
                                                <span className='badge badge-light-danger'>{g.count} interações</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!bottomGroups || bottomGroups.length === 0) && <tr><td className='text-muted'>Sem dados</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { GroupEngagementWidget }
