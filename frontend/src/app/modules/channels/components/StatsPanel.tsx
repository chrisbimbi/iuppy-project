import React, { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

interface Stats {
    posts: number
    views: number
    contributors: number
}

interface StatsPanelProps {
    channelId: string
}

const StatsPanel: React.FC<StatsPanelProps> = ({ channelId }) => {
    const intl = useIntl()
    const [stats, setStats] = useState<Stats | null>(null)

    useEffect(() => {
        // Aqui você pode chamar sua API de estatísticas:
        // ex: fetch(`/channels/${channelId}/stats`)...
        // Por enquanto, mock:
        setStats({ posts: 12, views: 1345, contributors: 4 })
    }, [channelId])

    if (!stats) {
        return <div>{intl.formatMessage({ id: 'CHANNELS.STATS.LOADING' })}</div>
    }

    return (
        <div className="row g-3">
            <div className="col-4">
                <div className="card card-flush text-center">
                    <div className="card-body">
                        <div className="fs-1 fw-bold">{stats.posts}</div>
                        <div className="fs-7 text-muted">{intl.formatMessage({ id: 'CHANNELS.STATS.POSTS' })}</div>
                    </div>
                </div>
            </div>
            <div className="col-4">
                <div className="card card-flush text-center">
                    <div className="card-body">
                        <div className="fs-1 fw-bold">{stats.views}</div>
                        <div className="fs-7 text-muted">{intl.formatMessage({ id: 'CHANNELS.STATS.VIEWS' })}</div>
                    </div>
                </div>
            </div>
            <div className="col-4">
                <div className="card card-flush text-center">
                    <div className="card-body">
                        <div className="fs-1 fw-bold">{stats.contributors}</div>
                        <div className="fs-7 text-muted">{intl.formatMessage({ id: 'CHANNELS.STATS.CONTRIBUTORS' })}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StatsPanel