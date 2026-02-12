
import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:3000';

type TurnoverStats = {
    rate: number
    admissions: number
    terminations: number
    headcount: number
    period: string
}

type Props = {
    className: string
    stats?: TurnoverStats
}

export const TurnoverStatsWidget: React.FC<Props> = ({ className, stats }) => {
    // If stats are not provided, we could fetch, but for now we expect them from Dashboard wrapper
    if (!stats) return null;

    return (
        <div className={`card ${className} bg-light-danger border-danger border-dashed border-1`}>
            <div className='card-body d-flex flex-column p-9'>
                <div className='fs-2hx fw-bold text-gray-900 mb-0'>
                    {stats.rate}%
                </div>
                <div className='fw-semibold text-gray-500 mb-6'>Taxa de Turnover ({stats.period})</div>

                <div className='d-flex flex-center flex-wrap mb-5'>
                    <div className='d-flex align-items-center flex-grow-1 me-5 mb-2'>
                        <div className='symbol symbol-circle symbol-25px me-3'>
                            <div className='symbol-label bg-success'>
                                <i className="bi bi-arrow-up-short text-white"></i>
                            </div>
                        </div>
                        <div className='d-flex flex-column'>
                            <span className='text-gray-900 fw-bold fs-6'>+{stats.admissions}</span>
                            <span className='text-muted fw-semibold fs-7'>Admissões</span>
                        </div>
                    </div>

                    <div className='d-flex align-items-center flex-grow-1 mb-2'>
                        <div className='symbol symbol-circle symbol-25px me-3'>
                            <div className='symbol-label bg-danger'>
                                <i className="bi bi-arrow-down-short text-white"></i>
                            </div>
                        </div>
                        <div className='d-flex flex-column'>
                            <span className='text-gray-900 fw-bold fs-6'>-{stats.terminations}</span>
                            <span className='text-muted fw-semibold fs-7'>Desligamentos</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
