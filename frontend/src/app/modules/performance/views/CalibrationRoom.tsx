import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { calibrateUser, getActiveCycle, getParticipants } from '../services/performanceService'
import { Content } from 'src/layout/components/Content'

// Mock Data for initial load
const initialData = {
    users: [
        { id: 'u1', name: 'Alice', quadrant: 'Low-Low' },
        { id: 'u2', name: 'Bob', quadrant: 'High-High' },
    ],
    quadrants: [
        { id: 'High-High', title: 'Top Performer (High Results, High Behavior)' },
        { id: 'High-Medium', title: 'Strong Performer' },
        { id: 'High-Low', title: 'Results Driven (Needs Beh. Dev)' },
        { id: 'Medium-High', title: 'Culture Carrier' },
        { id: 'Medium-Medium', title: 'Core Performer' },
        { id: 'Medium-Low', title: 'Inconsistent' },
        { id: 'Low-High', title: 'Potential Gem' },
        { id: 'Low-Medium', title: 'Underperformer' },
        { id: 'Low-Low', title: 'Critical Concern' },
    ]
}

export function CalibrationRoom() {
    const [users, setUsers] = useState<any[]>([])
    const [cycleId, setCycleId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Layout config (9-Box Grid)
    const quadrants = [
        { id: 'High-High', title: 'Top Performer (High Results, High Behavior)' },
        { id: 'High-Medium', title: 'Strong Performer' },
        { id: 'High-Low', title: 'Results Driven (Needs Beh. Dev)' },
        { id: 'Medium-High', title: 'Culture Carrier' },
        { id: 'Medium-Medium', title: 'Core Performer' },
        { id: 'Medium-Low', title: 'Inconsistent' },
        { id: 'Low-High', title: 'Potential Gem' },
        { id: 'Low-Medium', title: 'Underperformer' },
        { id: 'Low-Low', title: 'Critical Concern' },
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const cycle = await getActiveCycle()
            if (cycle) {
                setCycleId(cycle.id)
                const participants = await getParticipants(cycle.id)
                setUsers(participants)
            }
        } catch (error) {
            console.error('Failed to load calibration data', error)
        } finally {
            setLoading(false)
        }
    }

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId) return
        if (!cycleId) return

        const newQuadrant = destination.droppableId

        // Optimistic UI Update
        const updatedUsers = users.map(u =>
            u.id === draggableId ? { ...u, quadrant: newQuadrant } : u
        )
        setUsers(updatedUsers)

        // API Call
        try {
            await calibrateUser({
                userId: draggableId,
                cycleId,
                newQuadrant,
                justification: 'Manual Calibration (Drag & Drop)'
            })
        } catch (error) {
            console.error('Calibration failed', error)
            alert('Falha ao salvar calibração')
            loadData() // Revert on failure
        }
    }

    if (loading) return <div>Carregando...</div>

    return (
        <Content >
            <div className='p-4'>
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h2>Sala de Calibração (9-Box)</h2>
                    <span className="badge badge-light-success fs-6">Ciclo Ativo</span>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className='row g-3'>
                        {quadrants.map(q => (
                            <div key={q.id} className='col-4'>
                                <div className='card h-100 shadow-sm'>
                                    <div className='card-header min-h-40px px-3 py-2 bg-light'>
                                        <h6 className='card-title fs-7 m-0 text-gray-800'>{q.title}</h6>
                                    </div>
                                    <Droppable droppableId={q.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`card-body p-2 ${snapshot.isDraggingOver ? 'bg-light-primary' : ''}`}
                                                style={{ minHeight: '150px', maxHeight: '400px', overflowY: 'auto' }}
                                            >
                                                {users.filter(u => u.quadrant === q.id).map((u, index) => (
                                                    <Draggable key={u.id} draggableId={u.id} index={index}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className='card mb-2 shadow-sm p-3'
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                    backgroundColor: 'white',
                                                                    cursor: 'grab'
                                                                }}
                                                            >
                                                                <div className="d-flex align-items-center">
                                                                    <div className="symbol symbol-30px symbol-circle me-3">
                                                                        <span className="symbol-label bg-light-primary text-primary fw-bold">
                                                                            {u.name.charAt(0)}
                                                                        </span>
                                                                    </div>
                                                                    <div className="d-flex flex-column">
                                                                        <span className="fw-bold text-gray-800 fs-7">{u.name}</span>
                                                                        <span className="text-muted fs-8">{u.department || 'N/A'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            </div>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </Content>
    )
}
