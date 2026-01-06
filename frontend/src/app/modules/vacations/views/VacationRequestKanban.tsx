import React, { useEffect, useState } from 'react'
import { VacationRequest, VacationRequestStatus } from '@shared/types'
import { getRequests, approveRequest } from '../services/vacationService'

export function VacationRequestKanban() {
    const [requests, setRequests] = useState<VacationRequest[]>([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        try {
            const data = await getRequests('DEFAULT')
            setRequests(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleApprove = async (id: string) => {
        if (!confirm('Aprovar solicitação?')) return
        try {
            await approveRequest(id, 'CURRENT_USER_ID')
            fetchRequests()
        } catch (error) {
            alert('Erro ao aprovar')
        }
    }

    const renderColumn = (status: VacationRequestStatus, title: string, color: string) => {
        const items = requests.filter(r => r.status === status)
        return (
            <div className='col-md-4'>
                <div className={`card bg-light-${color} h-100`}>
                    <div className='card-header min-h-50px'>
                        <h3 className={`card-title text-${color}`}>{title} ({items.length})</h3>
                    </div>
                    <div className='card-body p-3'>
                        {items.map(r => (
                            <div key={r.id} className='card mb-3 shadow-sm'>
                                <div className='card-body p-3'>
                                    <h5 className='card-title fs-6'>Solicitação #{r.id.substring(0, 8)}</h5>
                                    <p className='text-gray-600 fs-7 mb-2'>
                                        De: {new Date(r.startDate).toLocaleDateString()}<br />
                                        Até: {new Date(r.endDate).toLocaleDateString()}
                                    </p>
                                    {status === VacationRequestStatus.PENDING && (
                                        <button
                                            className='btn btn-sm btn-success w-100'
                                            onClick={() => handleApprove(r.id)}
                                        >
                                            Aprovar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (loading) return <div>Carregando Kanban...</div>

    return (
        <div className='row'>
            {renderColumn(VacationRequestStatus.PENDING, 'Pendentes', 'warning')}
            {renderColumn(VacationRequestStatus.APPROVED, 'Aprovadas', 'success')}
            {renderColumn(VacationRequestStatus.REJECTED, 'Rejeitadas', 'danger')}
        </div>
    )
}
