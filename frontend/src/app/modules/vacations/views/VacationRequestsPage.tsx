import React, { useEffect, useState } from 'react'
import { getRequests, approveRequest, rejectRequest } from '../services/vacationService'
import { VacationRequest } from '@shared/types'
import { useAuth } from '../../../modules/auth/core/Auth'
import { Content } from 'src/layout/components/Content'
import { CollectiveVacationModal } from '../components/CollectiveVacationModal'

const VacationRequestsPage: React.FC = () => {
    const { currentUser } = useAuth()
    const [requests, setRequests] = useState<VacationRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [showCollectiveModal, setShowCollectiveModal] = useState(false)

    const fetchRequests = async () => {
        try {
            if (!currentUser?.companyId) return
            const data = await getRequests(currentUser.companyId)
            setRequests(data)
        } catch (error) {
            console.error('Error fetching requests', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [currentUser])

    const handleApprove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!window.confirm('Aprovar solicitação?')) return
        try {
            await approveRequest(id, currentUser?.id || 'admin')
            fetchRequests()
        } catch (error) {
            alert('Erro ao aprovar')
        }
    }

    const handleReject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const reason = window.prompt('Motivo da rejeição:')
        if (!reason) return
        try {
            await rejectRequest(id, currentUser?.id || 'admin', reason)
            fetchRequests()
        } catch (error) {
            alert('Erro ao rejeitar')
        }
    }

    if (loading) return <div>Carregando...</div>

    return (
        <Content>
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <div className="d-flex align-items-center position-relative my-1">
                            <h3>Solicitações de Férias</h3>
                        </div>
                    </div>
                    <div className="card-toolbar">
                        <button className="btn btn-sm btn-primary" onClick={() => setShowCollectiveModal(true)}>
                            <i className="bi bi-people-fill"></i> Coletivas
                        </button>
                    </div>
                </div>
                <div className="card-body py-4">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                    <th className="min-w-125px">Colaborador</th>
                                    <th className="min-w-125px">Início</th>
                                    <th className="min-w-125px">Fim</th>
                                    <th className="min-w-125px">Dias</th>
                                    <th className="min-w-125px">Status</th>
                                    <th className="text-end min-w-100px">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-semibold">
                                {requests.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.user?.name || '---'}</td>
                                        <td>{new Date(r.startDate).toLocaleDateString()}</td>
                                        <td>{new Date(r.endDate).toLocaleDateString()}</td>
                                        <td>{(new Date(r.endDate).getTime() - new Date(r.startDate).getTime()) / (1000 * 3600 * 24) + 1}</td>
                                        <td>
                                            <span className={`badge badge-light-${r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            <button className="btn btn-sm btn-icon btn-bg-light btn-active-color-primary me-2" onClick={(e) => handleApprove(r.id!, e)}>
                                                <i className="bi bi-check-lg fs-2"></i>
                                            </button>
                                            <button className="btn btn-sm btn-icon btn-bg-light btn-active-color-danger" onClick={(e) => handleReject(r.id!, e)}>
                                                <i className="bi bi-x-lg fs-2"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center">Nenhuma solicitação encontrada</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <CollectiveVacationModal
                show={showCollectiveModal}
                onClose={() => setShowCollectiveModal(false)}
                onSuccess={() => fetchRequests()}
            />
        </Content >
    )
}

export default VacationRequestsPage
