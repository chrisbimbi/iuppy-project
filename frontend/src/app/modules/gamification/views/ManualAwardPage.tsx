
import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { PageTitle } from '../../../../layout/core'
import { Content } from '../../../../layout/components/Content'
import { UserSearchAutocomplete } from '../components/UserSearchAutocomplete'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const ManualAwardPage: React.FC = () => {
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [amount, setAmount] = useState<number>(0)
    const [description, setDescription] = useState<string>('')
    const [reason, setReason] = useState<string>('')

    // Mutation for awarding XP
    const awardMutation = useMutation({
        mutationFn: async (data: { userIds: string[], amount: number, description: string, reason?: string }) => {
            await axios.post(`${API_URL}/gamification/manual-award`, data)
        },
        onSuccess: () => {
            toast.success('Pontos enviados com sucesso!')
            // Reset form
            setSelectedUserIds([])
            setAmount(0)
            setDescription('')
            setReason('')
        },
        onError: (error: any) => {
            toast.error('Erro ao enviar pontos: ' + (error.response?.data?.message || error.message))
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedUserIds.length === 0 || amount <= 0 || !description) {
            toast.error('Preencha todos os campos obrigatórios')
            return
        }
        awardMutation.mutate({
            userIds: selectedUserIds,
            amount,
            description,
            reason
        })
    }

    const toggleUser = (id: string) => {
        if (selectedUserIds.includes(id)) {
            setSelectedUserIds(selectedUserIds.filter(u => u !== id))
        } else {
            setSelectedUserIds([...selectedUserIds, id])
        }
    }

    return (
        <>
            <PageTitle breadcrumbs={[]}>Pontuação Manual</PageTitle>
            <Content>
                <div className='card'>
                    <div className='card-header'>
                        <h3 className='card-title'>Atribuir Pontos Manualmente</h3>
                    </div>
                    <div className='card-body'>
                        <form onSubmit={handleSubmit}>
                            {/* Users Selection - Search Autocomplete */}
                            <div className='mb-10'>
                                <label className='form-label required'>Buscar e Selecionar Usuários</label>
                                <UserSearchAutocomplete
                                    selectedUserIds={selectedUserIds}
                                    onToggleUser={toggleUser}
                                />
                                <div className='text-muted fs-7 mt-2'>
                                    {selectedUserIds.length} usuário(s) selecionado(s)
                                </div>
                            </div>

                            {/* Amount */}
                            <div className='mb-10'>
                                <label className='form-label required'>Quantidade de Pontos</label>
                                <input
                                    type='number'
                                    className='form-control form-control-solid'
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    placeholder='Ex: 50, 100'
                                />
                            </div>

                            {/* Reason / Description */}
                            <div className='mb-10'>
                                <label className='form-label required'>Descrição (Exibida ao Usuário)</label>
                                <input
                                    type='text'
                                    className='form-control form-control-solid'
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder='Ex: Premiação por Destaque do Mês'
                                />
                            </div>

                            <div className='mb-10'>
                                <label className='form-label'>Motivo Interno (Opcional)</label>
                                <textarea
                                    className='form-control form-control-solid'
                                    rows={3}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder='Ex: Solicitação do gestor X'
                                ></textarea>
                            </div>

                            <button
                                type='submit'
                                className='btn btn-primary'
                                disabled={awardMutation.isPending || selectedUserIds.length === 0}
                            >
                                {awardMutation.isPending ? 'Enviando...' : 'Enviar Pontos'}
                            </button>
                        </form>
                    </div>
                </div>
            </Content>
        </>
    )
}

export default ManualAwardPage
