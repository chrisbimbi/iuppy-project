import React, { useEffect, useState } from 'react';
import { api } from '../../../api';
import { KTIcon, toAbsoluteUrl } from '../../../../_metronic/helpers';

interface LeaderboardUser {
    id: string;
    name: string;
    avatarUrl?: string;
    xp: number;
    level: number;
    department?: string;
    jobTitle?: string;
}

export const GamificationLeaderboard: React.FC = () => {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const res = await api.get('/gamification/leaderboard');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to load leaderboard', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`card card-xl-stretch mb-xl-8`}>
            {/* Header */}
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Top Engajamento</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Ranking por XP</span>
                </h3>
            </div>
            {/* Body */}
            <div className='card-body py-3'>
                <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                        <thead>
                            <tr className='fw-bold text-muted'>
                                <th className='w-25px'>#</th>
                                <th className='min-w-150px'>Usuário</th>
                                <th className='min-w-120px'>Nível</th>
                                <th className='min-w-100px text-end'>XP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className='symbol symbol-45px me-5'>
                                            <span className='symbol-label fw-bold bg-light-primary text-primary'>
                                                {index + 1}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className='d-flex align-items-center'>
                                            <div className='symbol symbol-45px me-5'>
                                                {user.avatarUrl ? (
                                                    <img src={user.avatarUrl} alt={user.name} />
                                                ) : (
                                                    <span className='symbol-label bg-light-danger text-danger fw-bold'>
                                                        {user.name.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className='d-flex justify-content-start flex-column'>
                                                <span className='text-dark fw-bold text-hover-primary fs-6'>
                                                    {user.name}
                                                </span>
                                                <span className='text-muted fw-semibold text-muted d-block fs-7'>
                                                    {user.jobTitle || user.department || 'Colaborador'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className='badge badge-light-success fs-7 fw-bold'>Nível {user.level}</span>
                                    </td>
                                    <td className='text-end'>
                                        <div className='d-flex flex-column w-100 me-2'>
                                            <div className='d-flex flex-stack mb-2'>
                                                <span className='text-muted me-2 fs-7 fw-bold'>{user.xp} XP</span>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className='text-center text-muted'>
                                        Nenhum dado disponível
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
