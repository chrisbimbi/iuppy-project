import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { VacationRequest, VacationBalance, VacationRequestStatus } from '@shared/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function MyVacationsPage() {
    const [balance, setBalance] = useState<VacationBalance | null>(null)
    const [requests, setRequests] = useState<VacationRequest[]>([])
    const [loading, setLoading] = useState(true)

    // Form State
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [sellDays, setSellDays] = useState(false)
    const [request13th, setRequest13th] = useState(false)

    const userId = 'CURRENT_USER_ID' // Mock

    const fetchData = async () => {
        try {
            const [balRes, reqRes] = await Promise.all([
                axios.get(`${API_URL}/vacations/balance/${userId}`),
                axios.get(`${API_URL}/vacations/requests?companyId=DEFAULT`) // Should filter by My Requests in backend reality
            ])
            setBalance(balRes.data)
            // Filter client-side for demo since endpoint returns all for company
            setRequests(reqRes.data.filter((r: any) => r.userId === userId))
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await axios.post(`${API_URL}/vacations/requests`, {
                userId,
                startDate,
                endDate,
                soldDays: sellDays ? 10 : 0,
                request13th,
                type: 'INDIVIDUAL'
            })
            alert('Solicitação enviada com sucesso!')
            fetchData()
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erro ao solicitar')
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    if (loading) return <div>Carregando Minhas Férias...</div>

    return (
        <div className='container py-4'>
            <div className='row mb-4'>
                <div className='col-md-4'>
                    <div className='card bg-primary text-white'>
                        <div className='card-body'>
                            <h5>Saldo Disponível</h5>
                            <h2 className='display-4'>{balance?.daysVested || 0} dias</h2>
                            <p>Período: {balance?.periodStart ? new Date(balance.periodStart).toLocaleDateString() : '-'} a {balance?.periodEnd ? new Date(balance.periodEnd).toLocaleDateString() : '-'}</p>
                        </div>
                    </div>
                </div>
                <div className='col-md-8'>
                    <div className='card'>
                        <div className='card-header'>Solicitar Férias</div>
                        <div className='card-body'>
                            <form onSubmit={handleRequest} className='row g-3'>
                                <div className='col-md-6'>
                                    <label className='form-label'>Início</label>
                                    <input type='date' className='form-control' required value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div className='col-md-6'>
                                    <label className='form-label'>Fim</label>
                                    <input type='date' className='form-control' required value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                                <div className='col-12'>
                                    <div className='form-check'>
                                        <input className='form-check-input' type='checkbox' id='sell' checked={sellDays} onChange={e => setSellDays(e.target.checked)} />
                                        <label className='form-check-label' htmlFor='sell'>Vender 1/3 (Abono Pecuniário)</label>
                                    </div>
                                    <div className='form-check'>
                                        <input className='form-check-input' type='checkbox' id='13th' checked={request13th} onChange={e => setRequest13th(e.target.checked)} />
                                        <label className='form-check-label' htmlFor='13th'>Adiantar 1ª parcela do 13º</label>
                                    </div>
                                </div>
                                <div className='col-12'>
                                    <button type='submit' className='btn btn-success w-100'>Enviar Solicitação</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <h4>Histórico</h4>
            <table className='table table-striped'>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Período</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map(r => (
                        <tr key={r.id}>
                            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            <td>{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                            <td>
                                <span className={`badge bg-${r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'warning' : 'danger'}`}>
                                    {r.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
