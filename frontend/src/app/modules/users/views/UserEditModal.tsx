import React, { useState, useEffect } from 'react'
import { Modal, Button, Form, Alert } from 'react-bootstrap'
import { User } from '@shared/types'
import { createUser, updateUser } from '../services/usersService'

interface Props {
    show: boolean
    handleClose: () => void
    user?: User | null
    onSuccess: () => void
}

export function UserEditModal({ show, handleClose, user, onSuccess }: Props) {
    const [formData, setFormData] = useState<Partial<User>>({
        name: '',
        email: '',
        role: 'user',
        department: '',
        jobTitle: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department || '',
                jobTitle: user.jobTitle || '',
            })
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'user',
                department: '',
                jobTitle: '',
            })
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError(null)
        try {
            if (user) {
                await updateUser(user.id, formData)
            } else {
                await createUser(formData)
            }
            onSuccess()
            handleClose()
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar usuário')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{user ? 'Editar Usuário' : 'Novo Usuário'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Nome</Form.Label>
                        <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Permissão</Form.Label>
                        <Form.Select name="role" value={formData.role} onChange={handleChange}>
                            <option value="user">Usuário</option>
                            <option value="editor">Editor</option>
                            <option value="manager">Gerente</option>
                            <option value="company_admin">Admin da Empresa</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Departamento</Form.Label>
                        <Form.Control
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Cargo</Form.Label>
                        <Form.Control
                            type="text"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
