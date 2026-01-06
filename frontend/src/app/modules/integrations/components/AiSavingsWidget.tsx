
import React from 'react'

const AiSavingsWidget: React.FC = () => {
    // Mock Data
    const savings = {
        hoursSaved: 120,
        moneySaved: 'R$ 14.500',
        documentsProcessed: 450
    }

    return (
        <div className='card mb-5 mb-xl-10 bg-light-info'>
            <div className='card-body d-flex justify-content-between align-items-center'>
                <div className='d-flex flex-column'>
                    <h2 className='text-gray-800 mb-2'>Economia Gerada por AI</h2>
                    <span className='text-muted'>Estimativa baseada em processos automatizados</span>
                </div>

                <div className='d-flex gap-5'>
                    <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
                        <div className='d-flex align-items-center'>
                            <div className='fs-2 fw-bolder text-gray-800'>{savings.hoursSaved}h</div>
                        </div>
                        <div className='fw-bold fs-6 text-gray-400'>Horas Poupadas</div>
                    </div>

                    <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
                        <div className='d-flex align-items-center'>
                            <div className='fs-2 fw-bolder text-success'>{savings.moneySaved}</div>
                        </div>
                        <div className='fw-bold fs-6 text-gray-400'>Economia (BRL)</div>
                    </div>

                    <div className='border border-gray-300 border-dashed rounded min-w-125px py-3 px-4 me-6 mb-3'>
                        <div className='d-flex align-items-center'>
                            <div className='fs-2 fw-bolder text-primary'>{savings.documentsProcessed}</div>
                        </div>
                        <div className='fw-bold fs-6 text-gray-400'>Docs Processados</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AiSavingsWidget
