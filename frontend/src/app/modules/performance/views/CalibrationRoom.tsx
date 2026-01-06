import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { calibrateUser } from '../services/performanceService'

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
    const [users, setUsers] = useState(initialData.users)

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result
        if (!destination) return
        if (destination.droppableId === source.droppableId) return

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
                cycleId: 'CURRENT_CYCLE_ID',
                newQuadrant,
                justification: 'Manual Calibration'
            })
        } catch (error) {
            console.error('Calibration failed', error)
            alert('Falha ao salvar calibração')
            // Revert state if needed
        }
    }

    return (
        <div className='p-4'>
            <h2>Sala de Calibração (9-Box)</h2>
            <DragDropContext onDragEnd={onDragEnd}>
                <div className='row g-3'>
                    {initialData.quadrants.map(q => (
                        <div key={q.id} className='col-4'>
                            <div className='card h-100 shadow-sm'>
                                <div className='card-header min-h-40px px-3 py-2'>
                                    <h6 className='card-title fs-7 m-0'>{q.title}</h6>
                                </div>
                                <Droppable droppableId={q.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`card-body p-2 ${snapshot.isDraggingOver ? 'bg-light-primary' : ''}`}
                                            style={{ minHeight: '150px' }}
                                        >
                                            {users.filter(u => u.quadrant === q.id).map((u, index) => (
                                                <Draggable key={u.id} draggableId={u.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className='badge badge-light-primary w-100 mb-2 p-3 text-start'
                                                            style={provided.draggableProps.style}
                                                        >
                                                            <i className='fas fa-grip-vertical me-2 text-gray-400'></i>
                                                            {u.name}
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
    )
}
