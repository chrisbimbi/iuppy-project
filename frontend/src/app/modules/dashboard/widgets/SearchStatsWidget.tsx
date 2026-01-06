import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../../api'

type Term = {
    term: string
    count: number
    users: number
    trend: number
}

export const SearchStatsWidget: React.FC = () => {
    const { data: topTerms } = useQuery<Term[]>({
        queryKey: ['search-top-terms'],
        queryFn: async () => {
            const res = await api.get('/search/analytics/top-terms')
            return res.data
        }
    })

    const { data: noResults } = useQuery<Term[]>({
        queryKey: ['search-no-results'],
        queryFn: async () => {
            const res = await api.get('/search/analytics/no-results')
            return res.data
        }
    })

    const renderTrend = (trend: number) => {
        if (trend > 0) return <span className="badge badge-light-success fw-bold">+{trend}%</span>
        if (trend < 0) return <span className="badge badge-light-danger fw-bold">{trend}%</span>
        return <span className="badge badge-light-secondary fw-bold">-</span>
    }

    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-6">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-header border-0 pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold fs-3 text-dark">Top Buscas</span>
                            <span className="text-muted mt-1 fw-semibold fs-7">Termos mais buscados nos últimos 30 dias</span>
                        </h3>
                    </div>
                    <div className="card-body py-3">
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th className="min-w-150px">Termo</th>
                                        <th className="min-w-100px text-end">Buscas</th>
                                        <th className="min-w-100px text-end">Usuários</th>
                                        <th className="min-w-100px text-end">Tendência</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topTerms?.map((t, i) => (
                                        <tr key={i}>
                                            <td>
                                                <span className="text-dark fw-bold text-hover-primary fs-6">{t.term}</span>
                                            </td>
                                            <td className="text-end">
                                                <span className="text-muted fw-bold d-block fs-7">{t.count}</span>
                                            </td>
                                            <td className="text-end">
                                                <span className="text-muted fw-bold d-block fs-7">{t.users}</span>
                                            </td>
                                            <td className="text-end">
                                                {renderTrend(t.trend)}
                                            </td>
                                        </tr>
                                    ))}
                                    {topTerms?.length === 0 && (
                                        <tr><td colSpan={4} className="text-center text-muted">Sem dados ainda.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <div className="col-xl-6">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-header border-0 pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold fs-3 text-danger">Buscas sem Resultados</span>
                            <span className="text-muted mt-1 fw-semibold fs-7">O que os usuários buscam e não encontram</span>
                        </h3>
                    </div>
                    <div className="card-body pt-5">
                        {noResults?.map((t, i) => (
                            <div key={i} className="d-flex align-items-sm-center mb-7">
                                <div className="d-flex align-items-center flex-row-fluid flex-wrap">
                                    <div className="flex-grow-1 me-2">
                                        <span className="text-gray-800 text-hover-primary fs-6 fw-bold">{t.term}</span>
                                    </div>
                                    <span className="badge badge-light-danger fs-8 fw-bold">{t.count}</span>
                                </div>
                            </div>
                        ))}
                        {noResults?.length === 0 && <span className="text-muted">Sem dados ainda.</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}
