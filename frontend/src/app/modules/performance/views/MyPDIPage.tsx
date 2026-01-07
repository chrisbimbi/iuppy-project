import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PDI, PDIStatus } from '@shared/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

import { Content } from '../../../../layout/components/Content'

export function MyPDIPage() {
    const [pdis, setPdis] = useState<PDI[]>([])
    const [loading, setLoading] = useState(true)

    // Mock User ID
    const userId = 'CURRENT_USER_ID'

    const fetchPDI = async () => {
        try {
            const res = await axios.get(`${API_URL}/performance/pdi/${userId}`)
            setPdis(res.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPDI()
    }, [])

    if (loading) return <div>Carregando PDI...</div>

    return (
        <Content>
            <div className='d-flex justify-content-between align-items-center mb-4'>
                <h2>Meu Plano de Desenvolvimento (PDI)</h2>
                <button className='btn btn-primary'>+ Novo Plano</button>
            </div>

            <div className='row'>
                {pdis.map(item => (
                    <div key={item.id} className='col-md-4 mb-3'>
                        <div className={`card h-100 border-${item.status === 'COMPLETED' ? 'success' : 'primary'}`}>
                            <div className='card-body'>
                                <h5 className='card-title'>{item.title}</h5>
                                <p className='card-text text-muted'>Prazo: {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'Sem prazo'}</p>
                                <span className={`badge bg-${item.status === 'IN_PROGRESS' ? 'warning' : 'secondary'}`}>
                                    {item.status}
                                </span>
                            </div>
                            <div className='card-footer'>
                                <small className='text-muted'>Criado em {new Date(item.createdAt || Date.now()).toLocaleDateString()}</small>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {pdis.length === 0 && (
                <div className="text-center py-5">
                    <img src="https://cdni.iconscout.com/illustration/premium/thumb/checklist-4550274-3775194.png" height={200} alt="Empty" />
                    <p className="mt-3 text-muted">Você ainda não tem itens no seu PDI.</p>
                </div>
            )}
        </Content>
    )
}
