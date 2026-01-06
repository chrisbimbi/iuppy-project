
import React, { useEffect, useState } from 'react'
import { KTIcon } from 'src/helpers'
import { User } from '@shared/types'
import { getUsers, deleteUser } from '../services/usersService'
import { UserEditModal } from './UserEditModal'

interface Props {
    onPermissions: (user: User) => void
}

export function UsersList({ onPermissions }: Props) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [showEditModal, setShowEditModal] = useState(false)

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const confirmDelete = async () => {
        if (deleteId) {
            try {
                await deleteUser(deleteId)
                fetchUsers()
            } catch (error) {
                alert('Erro ao excluir usuário')
            } finally {
                setDeleteId(null)
            }
        }
    }

    const handleDelete = (id: string) => {
        setDeleteId(id)
    }

    const handleEdit = (user: User) => {
        setEditingUser(user)
        setShowEditModal(true)
    }

    const handleCloseModal = () => {
        setEditingUser(null)
        setShowEditModal(false)
    }

    const formatDate = (date?: Date | string) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('pt-BR')
    }

    const isActiveInLast60Days = (lastLogin?: Date | string) => {
        if (!lastLogin) return false
        const date = new Date(lastLogin)
        const now = new Date()
        const diffTime = Math.abs(now.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 60
    }

    const roleMap: Record<string, string> = {
        'hr_admin': 'Admin RH',
        'company_admin': 'Admin Empresa',
        'editor': 'Editor',
        'viewer': 'Visualizador',
        'user': 'Usuário'
    }

    if (loading) return <div>Carregando...</div>

    return (
        <>
            <div className='table-responsive'>
                <table className='table align-middle table-row-dashed fs-6 gy-5'>
                    <thead>
                        <tr className='text-start text-muted fw-bolder fs-7 text-uppercase gs-0'>
                            <th className='min-w-125px'>Usuário</th>
                            <th className='min-w-125px'>Função</th>
                            <th className='min-w-125px'>Departamento</th>
                            <th className='min-w-125px'>Primeiro Acesso</th>
                            <th className='min-w-125px'>Último Acesso</th>
                            <th className='min-w-125px'>Status (60d)</th>
                            <th className='text-end min-w-100px'>Ações</th>
                        </tr>
                    </thead>
                    <tbody className='text-gray-600 fw-bold'>
                        {users.map((user) => {
                            const active60d = isActiveInLast60Days(user.lastLoginAt)
                            return (
                                <tr key={user.id}>
                                    <td className='d-flex align-items-center'>
                                        <div className='d-flex flex-column'>
                                            <span className='text-gray-800 text-hover-primary mb-1'>
                                                {user.name}
                                            </span>
                                            <span>{user.email}</span>
                                        </div>
                                    </td>
                                    <td>{roleMap[user.role] || user.role}</td>
                                    <td>{user.department || '-'}</td>
                                    <td>{formatDate(user.firstLoginAt)}</td>
                                    <td>{formatDate(user.lastLoginAt)}</td>
                                    <td>
                                        <span className={`badge badge-light-${active60d ? 'success' : 'warning'}`}>
                                            {active60d ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className='text-end'>
                                        <button
                                            className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                            onClick={() => handleEdit(user)}
                                        >
                                            <KTIcon iconName='pencil' className='fs-3' />
                                        </button>
                                        <button
                                            className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1'
                                            onClick={() => onPermissions(user)}
                                            title="Permissões"
                                        >
                                            <KTIcon iconName='shield-tick' className='fs-3' />
                                        </button>
                                        <button
                                            className='btn btn-icon btn-bg-light btn-active-color-primary btn-sm'
                                            onClick={() => handleDelete(user.id)}
                                        >
                                            <KTIcon iconName='trash' className='fs-3' />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <UserEditModal
                show={showEditModal}
                handleClose={handleCloseModal}
                user={editingUser}
                onSuccess={fetchUsers}
            />
        </>
    )
}
