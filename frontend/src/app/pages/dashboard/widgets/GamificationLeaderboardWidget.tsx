import React from 'react'
import { toAbsoluteUrl } from '../../../../helpers'

type Props = {
    overview: {
        totalXP: number
        avgXP: number
    }
    ranking?: Array<{
        userId: string
        xp: number
        rank: number
        user: { name: string; avatar: string }
    }>
}

export const GamificationLeaderboardWidget: React.FC<Props> = ({ overview, ranking }) => {
    return (
        <div className='card card-xl-stretch mb-xl-8'>
            <div className='card-header border-0 py-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Liderança & Gamificação</span>
                    <span className='text-muted fw-bold fs-7'>Top 10 engajados este mês</span>
                </h3>
                <div className='card-toolbar'>
                    <span className='badge badge-light-primary fw-bolder me-2 px-3 py-2'>AGOSTO 2026</span>
                </div>
            </div>

            <div className='card-body pt-0'>
                {/* Stats Summary */}
                <div className='d-flex flex-stack mb-7'>
                    <div className='d-flex align-items-center me-3'>
                        <div className='symbol symbol-40px me-3'>
                            <div className='symbol-label bg-light-warning'>
                                <i className='bi bi-trophy-fill text-warning fs-2'></i>
                            </div>
                        </div>
                        <div className='d-flex flex-column'>
                            <span className='text-dark fw-bolder fs-6'>{overview.totalXP.toLocaleString()} XP</span>
                            <span className='text-muted fw-bold fs-7'>Acumulado Geral</span>
                        </div>
                    </div>
                    <div className='d-flex align-items-center'>
                        <span className='badge badge-light-success fs-8 fw-bolder'>+24% de crescimento</span>
                    </div>
                </div>

                {/* Ranking Table (Screenshot 2 Style) */}
                <div className='table-responsive'>
                    <table className='table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4'>
                        <thead>
                            <tr className='fw-bolder text-muted bg-light'>
                                <th className='ps-4 min-w-150px rounded-start'>Colaborador</th>
                                <th className='min-w-100px text-end'>Pontuação</th>
                                <th className='min-w-100px text-end rounded-end pe-4'>Trending</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranking?.map((item, index) => (
                                <tr key={item.userId}>
                                    <td className='ps-0'>
                                        <div className='d-flex align-items-center ps-4'>
                                            <div className='symbol symbol-45px me-5'>
                                                {item.user?.avatar ? (
                                                    <img src={item.user.avatar} alt={item.user.name} />
                                                ) : (
                                                    <div className='symbol-label bg-light-primary text-primary fw-bolder'>
                                                        {item.user?.name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className='d-flex justify-content-start flex-column'>
                                                <span className='text-dark fw-bolder text-hover-primary fs-6'>
                                                    {item.user?.name}
                                                </span>
                                                <span className='text-muted fw-bold fs-7 d-block'>Level {Math.floor(item.xp / 1000) + 1}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className='text-end'>
                                        <span className='text-dark fw-bolder d-block fs-6'>{item.xp.toLocaleString()}</span>
                                        <span className='text-muted fs-8 fw-bold'>XP Total</span>
                                    </td>
                                    <td className='text-end pe-4'>
                                        <div className='d-flex flex-column align-items-end'>
                                            <span className='text-success fw-bolder fs-7'>+{Math.floor(Math.random() * 500)}</span>
                                            <div className='progress h-5px w-100 mt-1 bg-light-success'>
                                                <div
                                                    className='progress-bar bg-success'
                                                    role='progressbar'
                                                    style={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className='d-flex flex-stack pt-3'>
                    <span className='text-muted fw-bold fs-7'>Mostrando top 5 integrantes</span>
                    <button className='btn btn-sm btn-light fw-bolder btn-active-light-primary'>Ranking Completo</button>
                </div>
            </div>
        </div>
    )
}
