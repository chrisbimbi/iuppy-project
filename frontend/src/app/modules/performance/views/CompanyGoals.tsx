import React, { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

import { useAuth } from '../../../modules/auth/core/Auth'
import { Content } from 'src/layout/components/Content'

export function CompanyGoals() {
    const { currentUser } = useAuth()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUser?.companyId) return

        setLoading(true)
        try {
            await axios.post(`${API_URL}/performance/goals`, {
                companyId: currentUser.companyId,
                userId: currentUser.id,
                title,
                description,
                progress: 0,
                status: 'IN_PROGRESS'
            })
            alert('Meta da empresa criada!')
            setTitle('')
            setDescription('')
        } catch (error) {
            console.error(error)
            alert('Erro ao criar meta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Content>
            <div className='card'>
                <div className='card-header'>
                    <h3 className='card-title'>Metas da Empresa (Company Goals)</h3>
                </div>
                <div className='card-body'>
                    <form onSubmit={handleSubmit}>
                        <div className='mb-3'>
                            <label className='form-label'>Título da Meta</label>
                            <input
                                className='form-control'
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder='Ex: Atingir R$ 10M de ARR'
                                required
                            />
                        </div>
                        <div className='mb-3'>
                            <label className='form-label'>Descrição / KRs</label>
                            <textarea
                                className='form-control'
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                        <button className='btn btn-primary' disabled={loading}>
                            {loading ? 'Criando...' : 'Criar Meta Global'}
                        </button>
                    </form>
                </div>
            </div>
        </Content>
    )
}
