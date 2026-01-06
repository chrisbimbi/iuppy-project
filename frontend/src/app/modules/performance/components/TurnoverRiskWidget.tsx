
import React from 'react'

const TurnoverRiskWidget: React.FC = () => {
    // Mock Data simulating AI output
    const riskStats = {
        highRiskCount: 12,
        mediumRiskCount: 45,
        avgRiskScore: 0.35,
        trend: '+2%'
    }

    return (
        <div className='card mb-5 mb-xl-8 bg-light-danger'>
            <div className='card-body'>
                <div className='d-flex align-items-center justify-content-between mb-5'>
                    <div className='d-flex flex-column'>
                        <h2 className='text-gray-800 fw-bolder mb-1'>Risco de Turnover (AI)</h2>
                        <span className='text-gray-500 fw-bold fs-6'>Predição baseada no FlightRiskModel</span>
                    </div>
                    <span className='badge badge-light-danger fs-6 fw-bolder'>{riskStats.trend} vs mês anterior</span>
                </div>

                <div className='d-flex justify-content-around'>
                    <div className='d-flex flex-column align-items-center'>
                        <span className='fs-2hx fw-bolder text-danger'>{riskStats.highRiskCount}</span>
                        <span className='text-gray-600 fw-bold'>Alto Risco</span>
                    </div>
                    <div className='d-flex flex-column align-items-center'>
                        <span className='fs-2hx fw-bolder text-warning'>{riskStats.mediumRiskCount}</span>
                        <span className='text-gray-600 fw-bold'>Médio Risco</span>
                    </div>
                    <div className='d-flex flex-column align-items-center'>
                        <span className='fs-2hx fw-bolder text-gray-800'>{Math.round(riskStats.avgRiskScore * 100)}%</span>
                        <span className='text-gray-600 fw-bold'>Score Médio</span>
                    </div>
                </div>

                <div className='mt-5 text-center'>
                    <button className='btn btn-sm btn-danger'>Ver Detalhes do Risco</button>
                </div>
            </div>
        </div>
    )
}

export default TurnoverRiskWidget
