import React from 'react'

type TopUser = {
    id: string
    name: string
    role?: string
    avatar?: string
    xp: number
    color?: string
}

type Props = {
    users: TopUser[]
    className?: string
}

export const TopUsersWidget: React.FC<Props> = ({ users, className }) => {
    if (!users || users.length === 0) return null

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Top Colaboradores</span>
                    <span className='text-muted fw-bold fs-7'>Mais engajados na plataforma</span>
                </h3>
                <div className='card-toolbar'>
                    <button className='btn btn-sm btn-light-primary fw-bolder'>Ver Todos</button>
                </div>
            </div>
            <div className='card-body py-3'>
                <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                        <thead>
                            <tr className='fw-bolder text-muted'>
                                <th className='ps-0 min-w-150px'>Usuário</th>
                                <th className='min-w-100px text-end'>XP</th>
                                <th className='min-w-100px text-end'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => (
                                <tr key={i}>
                                    <td className='ps-0'>
                                        <div className='d-flex align-items-center'>
                                            <div className='symbol symbol-45px me-3'>
                                                {user.avatar ? (
                                                    <div className='symbol-label' style={{ backgroundImage: `url(${user.avatar})` }}></div>
                                                ) : (
                                                    <div className={`symbol-label bg-light-${user.color || 'primary'} text-${user.color || 'primary'} fw-bolder`}>
                                                        {(user.name || '?')[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className='d-flex flex-column'>
                                                <span className='text-gray-800 fw-bolder text-hover-primary mb-1 fs-6'>
                                                    {user.name}
                                                </span>
                                                <span className='text-muted fw-bold fs-7'>{user.role || 'Colaborador'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='text-end'>
                                        <span className='text-gray-800 fw-bolder d-block fs-6'>
                                            {Number(user.xp || 0).toLocaleString()} XP
                                        </span>
                                    </td>
                                    <td className='text-end'>
                                        <span className={`badge badge-light-${user.color || 'primary'} fs-8 fw-bolder`}>
                                            Ativo
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
