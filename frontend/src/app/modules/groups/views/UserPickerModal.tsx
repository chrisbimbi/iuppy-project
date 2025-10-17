import React, { useState, useEffect, useRef } from 'react'
import { Modal } from 'bootstrap'
import clsx from 'clsx'
import { User } from '@shared/types'

interface Props {
    show: boolean
    title: string
    allUsers: User[]
    selected: string[]
    onClose(): void
    onConfirm(next: string[]): void
}

const UserPickerModal: React.FC<Props> = ({
    show, title, allUsers, selected, onClose, onConfirm
}) => {
    const ref = useRef<HTMLDivElement>(null)
    const [modal, setModal] = useState<Modal | null>(null)
    const [filter, setFilter] = useState('')
    const [ids, setIds] = useState<string[]>(selected)

    // inicializa o Bootstrap Modal
    useEffect(() => {
        if (ref.current && !modal) {
            setModal(new Modal(ref.current, { backdrop: 'static' }))
        }
    }, [ref, modal])

    // abre/fecha o modal e reseta seleção
    useEffect(() => {
        if (!modal) return
        show ? modal.show() : modal.hide()
        setIds(selected)
        setFilter('')
    }, [show, selected, modal])

    const toggle = (id: string) =>
        setIds(curr => (curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]))

    const visible = allUsers.filter(u =>
        u.name.toLowerCase().includes(filter.toLowerCase()) ||
        u.email.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div className="modal fade" tabIndex={-1} ref={ref}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" onClick={onClose} />
                    </div>
                    <div className="modal-body">
                        <input
                            type="text"
                            className="form-control mb-3"
                            placeholder="Buscar usuários..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                        <div className="row g-2" style={{ maxHeight: 300, overflowY: 'auto' }}>
                            {visible.map(u => (
                                <div key={u.id} className="col-6 col-md-4">
                                    <div
                                        className={clsx(
                                            'card p-2 d-flex align-items-center',
                                            ids.includes(u.id) && 'border-primary bg-light'
                                        )}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => toggle(u.id)}
                                    >
                                        <img
                                            src={u.avatarUrl || '/media/avatars/blank.png'}
                                            className="rounded-circle mb-2"
                                            width={48}
                                            height={48}
                                            alt={u.name}
                                        />
                                        <div className="text-center">
                                            <div className="fw-semibold">{u.name}</div>
                                            <small className="text-muted d-block">{u.spaceId || '—'}</small>
                                            <small className="text-muted">{u.role}</small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-light" onClick={onClose}>
                            Cancelar
                        </button>
                        <button
                            className="btn btn-primary"
                            disabled={ids.length === 0}
                            onClick={() => onConfirm(ids)}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserPickerModal