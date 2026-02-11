import React from 'react'

type Props = {
    className: string
    activeCycles: number
    nineBoxDistribution: Record<string, number>
}

const PerformanceWidget: React.FC<Props> = ({ className, activeCycles, nineBoxDistribution }) => {
    // 9-Box Logic: 
    // Rows (Y): High, Medium, Low (Potential/Competencies)
    // Cols (X): Low, Medium, High (Results/Goals)

    const rows = ['High', 'Medium', 'Low'];
    const cols = ['Low', 'Medium', 'High'];

    const getCount = (y: string, x: string) => {
        const key = `${x}-${y}`; // Our backend returns 'X-Y' (e.g. Low-High)
        return nineBoxDistribution ? nineBoxDistribution[key] || 0 : 0;
    }

    const maxCount = nineBoxDistribution ? Math.max(...Object.values(nineBoxDistribution)) : 1;

    const getOpacity = (count: number) => {
        if (count === 0) return 0.1;
        return 0.2 + (count / maxCount) * 0.8;
    }

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bold fs-3 mb-1'>Densidade de Talentos</span>
                    <span className='text-muted mt-1 fw-semibold fs-7'>Matriz 9-Box ({activeCycles} ciclo{activeCycles !== 1 && 's'} ativo{activeCycles !== 1 && 's'})</span>
                </h3>
            </div>
            <div className='card-body pt-3 pb-5'>
                <div className="d-flex flex-column align-items-center">
                    <div className="d-flex">
                        <div className="d-flex flex-column justify-content-center me-2">
                            <span className="text-muted fw-bold fs-8" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Potencial / Competências</span>
                        </div>
                        <div>
                            {/* Grid Container */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', width: '240px', height: '240px' }}>
                                {rows.map(row => (
                                    cols.map(col => {
                                        const count = getCount(row, col);
                                        // Color logic: High-High is Green, Low-Low is Red/Orange
                                        let color = 'bg-primary';
                                        if (row === 'High' && col === 'High') color = 'bg-success';
                                        if (row === 'Low' && col === 'Low') color = 'bg-danger';

                                        return (
                                            <div key={`${row}-${col}`}
                                                className={`rounded d-flex align-items-center justify-content-center border border-gray-300 fs-6 fw-bold ${color}`}
                                                style={{ opacity: getOpacity(count), color: count > 0 ? '#fff' : '#000' }}
                                                title={`${col} Results - ${row} Potential: ${count} users`}
                                            >
                                                {count > 0 && count}
                                            </div>
                                        )
                                    })
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2">
                        <span className="text-muted fw-bold fs-8">Resultados / Metas</span>
                    </div>
                </div>

                <div className="d-flex justify-content-center mt-5">
                    <div className="d-flex align-items-center me-5">
                        <span className="bullet bullet-dot bg-success h-10px w-10px me-2"></span>
                        <span className="text-gray-500 fs-7">Top Talent</span>
                    </div>
                    <div className="d-flex align-items-center">
                        <span className="bullet bullet-dot bg-danger h-10px w-10px me-2"></span>
                        <span className="text-gray-500 fs-7">Risco</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export { PerformanceWidget }
