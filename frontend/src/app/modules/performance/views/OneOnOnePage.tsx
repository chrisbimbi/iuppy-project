import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { OneOnOne, OneOnOneStatus } from '@shared/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

import { useAuth } from '../../../modules/auth/core/Auth'

export function OneOnOnePage() {
    const { currentUser } = useAuth()
    const [meetings, setMeetings] = useState<OneOnOne[]>([])
    const [loading, setLoading] = useState(true)
    const [newNote, setNewNote] = useState('')

    const fetchMeetings = async () => {
        if (!currentUser) return
        try {
            const res = await axios.get(`${API_URL}/performance/1on1?userId=${currentUser.id}`)
            setMeetings(res.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const scheduleMeeting = async () => {
        if (!currentUser) return
        // Ideally prompt for participant ID
        const participantId = prompt('ID do participante (Simulado):', 'MANAGER_001')
        if (!participantId) return

        try {
            await axios.post(`${API_URL}/performance/1on1`, {
                organizerUserId: currentUser.id,
                participantUserId: participantId,
                scheduledDate: new Date().toISOString(),
                status: 'SCHEDULED'
            })
            fetchMeetings()
        } catch (error) {
            alert('Erro ao agendar')
        }
    }

    useEffect(() => {
        fetchMeetings()
    }, [])

    if (loading) return <div>Carregando 1:1s...</div>

    return (
        <div className='container py-4'>
            <div className='d-flex justify-content-between align-items-center mb-4'>
                <h2>Reuniões 1:1</h2>
                <button className='btn btn-primary' onClick={scheduleMeeting}>
                    + Nova Reunião
                </button>
            </div>

            <div className='row'>
                {meetings.map(m => (
                    <div key={m.id} className='col-md-6 mb-3'>
                        <div className='card h-100'>
                            <div className='card-header d-flex justify-content-between'>
                                <span>{new Date(m.scheduledDate).toLocaleDateString()}</span>
                                <span className='badge bg-info'>{m.status}</span>
                            </div>
                            <div className='card-body'>
                                <h6>Pauta (Talking Points)</h6>
                                {m.talkingPoints?.length === 0 && <span className='text-muted'>Nada na pauta.</span>}
                                <ul className='list-group list-group-flush mb-3'>
                                    {m.talkingPoints?.map((tp: any, idx) => (
                                        <li key={idx} className='list-group-item'>
                                            <input type='checkbox' checked={tp.checked} readOnly className='me-2' />
                                            {tp.text}
                                        </li>
                                    ))}
                                </ul>
                                <div className='input-group'>
                                    <input
                                        type='text'
                                        className='form-control'
                                        placeholder='Adicionar item...'
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                    />
                                    <button className='btn btn-outline-secondary'>Add</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
