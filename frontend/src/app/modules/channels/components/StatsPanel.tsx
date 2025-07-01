import React, { useEffect, useState } from 'react'

interface Stats {
    posts: number
    views: number
    contributors: number
}

interface StatsPanelProps {
    channelId: string
}

const StatsPanel: React.FC<StatsPanelProps> = ({ channelId }) => {
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {
        // Aqui você pode chamar sua API de estatísticas:
        // ex: fetch(`/channels/${channelId}/stats`)...
        // Por enquanto, mock:
        setStats({ posts: 12, views: 1345, contributors: 4 })
    }, [channelId])

    if (!stats) {
        return <div>Carregando estatísticas…</div>
    }

    return (
        <div className="row g-3">
            <div className="col-4">
                <div className="card card-flush text-center">
                    <div className="card-body">
                        <div className="fs-1 fw-bold">{stats.posts}</div>
                        <div className="fs-7 text-muted">Postagens</div>
                    </div>
                </div>
            </div>
            <div className="col-4">
                <div className="card card-flush text-center">
                    <div className="card-body">
                        <div className="fs-1 fw-bold">{stats.views}</div>
                        <div className="fs-7 text-muted">Visualizações</div>
                    </div>
                </div>
            </div>
            <div className="col-4">
                <div className="card card-flush text-center">
                    <div className="card-body">
                        <div className="fs-1 fw-bold">{stats.contributors}</div>
                        <div className="fs-7 text-muted">Contribuidores</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatsPanel