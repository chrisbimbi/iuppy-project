import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api'

type Hashtag = {
    hashtag: string
    count: number
    views: number
}

export const HashtagStatsWidget: React.FC = () => {
    const { data: hashtags } = useQuery<Hashtag[]>({
        queryKey: ['hashtag-top'],
        queryFn: async () => {
            const res = await api.get('/news/analytics/hashtags/top')
            return res.data
        }
    })

    return (
        <div className="card card-xl-stretch mb-5 mb-xl-8">
            <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold fs-3 text-dark">Top Hashtags</span>
                    <span className="text-muted mt-1 fw-semibold fs-7">Hashtags mais utilizadas e visualizadas</span>
                </h3>
            </div>
            <div className="card-body pt-5">
                <div className="d-flex flex-wrap gap-2">
                    {hashtags?.map((h, i) => (
                        <div key={i} className="d-flex align-items-center border border-gray-300 rounded p-2 me-3 mb-3">
                            <span className="fs-6 fw-bold text-gray-800 me-2">#{h.hashtag}</span>
                            <span className="badge badge-light-primary me-2" title="Posts">{h.count} posts</span>
                            <span className="badge badge-light-info" title="Visualizações">{h.views} views</span>
                        </div>
                    ))}
                    {hashtags?.length === 0 && <span className="text-muted">Sem dados ainda.</span>}
                </div>
            </div>
        </div>
    )
}
