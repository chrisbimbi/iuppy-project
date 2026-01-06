import { FC, useEffect, useState } from 'react'
import { getGeneralStats } from '../services/journeys.service'

import { useIntl } from 'react-intl'

export const JourneyGeneralStats: FC = () => {
    const intl = useIntl()
    const [stats, setStats] = useState<any>({
        totalActiveJourneys: 0,
        totalImpactedUsers: 0,
        totalCompletions: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getGeneralStats()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return null

    return (
        <div className='row g-5 g-xl-8 mb-10'>
            <div className='col-xl-4'>
                <div className='card bg-primary hoverable card-xl-stretch mb-xl-8'>
                    <div className='card-body my-3'>
                        <div className='card-title fw-bold text-white fs-5 mb-3 d-block'>{intl.formatMessage({ id: 'JOURNEYS.STATS.ACTIVE_JOURNEYS' })}</div>
                        <div className='py-1'>
                            <span className='text-white fs-1 fw-bold me-2'>{stats.totalActiveJourneys}</span>
                            <span className='fw-semibold text-white opacity-75 fs-7'>{intl.formatMessage({ id: 'JOURNEYS.STATS.LABEL.JOURNEYS' })}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className='col-xl-4'>
                <div className='card bg-dark hoverable card-xl-stretch mb-xl-8'>
                    <div className='card-body my-3'>
                        <div className='card-title fw-bold text-white fs-5 mb-3 d-block'>{intl.formatMessage({ id: 'JOURNEYS.STATS.IMPACTED_USERS' })}</div>
                        <div className='py-1'>
                            <span className='text-white fs-1 fw-bold me-2'>{stats.totalImpactedUsers}</span>
                            <span className='fw-semibold text-white opacity-75 fs-7'>{intl.formatMessage({ id: 'JOURNEYS.STATS.LABEL.USERS' })}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className='col-xl-4'>
                <div className='card bg-success hoverable card-xl-stretch mb-xl-8'>
                    <div className='card-body my-3'>
                        <div className='card-title fw-bold text-white fs-5 mb-3 d-block'>{intl.formatMessage({ id: 'JOURNEYS.STATS.COMPLETIONS' })}</div>
                        <div className='py-1'>
                            <span className='text-white fs-1 fw-bold me-2'>{stats.totalCompletions}</span>
                            <span className='fw-semibold text-white opacity-75 fs-7'>{intl.formatMessage({ id: 'JOURNEYS.STATS.LABEL.COMPLETED' })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
