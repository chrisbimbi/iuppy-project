import React from 'react'
import { PageTitle } from 'src/layout/core'
import { Card, CardBody, CardHeader, Row, Col } from 'react-bootstrap'
import { KTIcon } from 'src/helpers'
import ReactApexChart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'
import { useQuery } from '@tanstack/react-query'
import { api } from 'src/app/modules/auth/core/_requests'
import { Link } from 'react-router-dom'
import { Content } from 'src/layout/components/Content'

interface OverviewStats {
    totalXPDistributed: number
    activeUsers: number
    averageXPPerUser: number
    totalActions: number
}

interface RankingUser {
    userId: string
    name: string
    avatarUrl?: string
    xp: number
    level: number
}

interface HeatmapDay {
    date: string
    xp: number
    actions: number
}

interface ActionTypeDistribution {
    actionType: string
    xp: number
    count: number
    percentage: number
}

const GamificationDashboard: React.FC = () => {
    const { data: overview, isLoading: loadingOverview } = useQuery<OverviewStats>({
        queryKey: ['gamification-overview'],
        queryFn: async () => {
            const res = await api.get('/gamification/analytics/overview')
            return res.data
        }
    })

    const { data: ranking, isLoading: loadingRanking } = useQuery<RankingUser[]>({
        queryKey: ['gamification-ranking'],
        queryFn: async () => {
            const res = await api.get('/gamification/analytics/ranking?limit=10')
            return res.data
        }
    })

    const { data: actionTypes, isLoading: loadingActionTypes } = useQuery<ActionTypeDistribution[]>({
        queryKey: ['gamification-action-types'],
        queryFn: async () => {
            const res = await api.get('/gamification/analytics/by-action-type')
            return res.data
        }
    })

    const { data: heatmap, isLoading: loadingHeatmap } = useQuery<HeatmapDay[]>({
        queryKey: ['gamification-heatmap'],
        queryFn: async () => {
            const from = new Date()
            from.setDate(from.getDate() - 30)
            const to = new Date()
            const res = await api.get(
                `/gamification/analytics/heatmap?from=${from.toISOString()}&to=${to.toISOString()}`
            )
            return res.data
        }
    })

    // Chart configurations
    const pieOptions: ApexOptions = {
        chart: {
            type: 'pie',
        },
        labels: actionTypes?.map((a: ActionTypeDistribution) => a.actionType) || [],
        legend: {
            position: 'bottom',
        },
        responsive: [
            {
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200,
                    },
                    legend: {
                        position: 'bottom',
                    },
                },
            },
        ],
    }

    const pieSeries = actionTypes?.map((a: ActionTypeDistribution) => a.xp) || []

    const lineOptions: ApexOptions = {
        chart: {
            type: 'line',
            toolbar: {
                show: false,
            },
        },
        xaxis: {
            categories: heatmap?.map((d: HeatmapDay) => d.date) || [],
            labels: {
                rotate: -45,
            },
        },
        stroke: {
            curve: 'smooth',
        },
        markers: {
            size: 4,
        },
    }

    const lineSeries = [
        {
            name: 'XP Distribuído',
            data: heatmap?.map((d: HeatmapDay) => d.xp) || [],
        },
    ]


    return (
        <Content>
            <PageTitle breadcrumbs={[]}>Dashboard de Gamificação</PageTitle>

            {/* Navigation Buttons */}
            <div className='d-flex justify-content-end gap-2 mb-5'>
                <Link to='/gamification/settings' className='btn btn-sm btn-light-primary'>
                    <KTIcon iconName='gear' className='fs-3' />
                    Configurações
                </Link>
                <Link to='/gamification/manual-award' className='btn btn-sm btn-light-success'>
                    <KTIcon iconName='medal-star' className='fs-3' />
                    Pontuar Manualmente
                </Link>
            </div>

            {/* Overview Cards */}
            <Row className="g-5 g-xl-8 mb-5">
                <Col xl={3}>
                    <Card className="card-flush h-xl-100">
                        <CardHeader className="pt-5">
                            <div className="card-title d-flex flex-column">
                                <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">
                                    {overview?.totalXPDistributed || 0}
                                </span>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">XP Total Distribuído</span>
                            </div>
                        </CardHeader>
                        <CardBody className="d-flex align-items-end pt-0">
                            <div className="d-flex align-items-center flex-column mt-3 w-100">
                                <div className="d-flex justify-content-between fw-bold fs-6 text-gray-400 w-100 mt-auto mb-2">
                                    <span>Usuários Ativos (30d)</span>
                                    <span>{overview?.activeUsers || 0}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                <Col xl={3}>
                    <Card className="card-flush h-xl-100">
                        <CardHeader className="pt-5">
                            <div className="card-title d-flex flex-column">
                                <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">
                                    {overview?.averageXPPerUser || 0}
                                </span>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">Média de XP por Usuário</span>
                            </div>
                        </CardHeader>
                    </Card>
                </Col>

                <Col xl={3}>
                    <Card className="card-flush h-xl-100">
                        <CardHeader className="pt-5">
                            <div className="card-title d-flex flex-column">
                                <span className="fs-2hx fw-bold text-dark me-2 lh-1 ls-n2">
                                    {overview?.totalActions || 0}
                                </span>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">Total de Ações</span>
                            </div>
                        </CardHeader>
                    </Card>
                </Col>

                <Col xl={3}>
                    <Card className="card-flush h-xl-100 border-primary">
                        <CardHeader className="pt-5">
                            <div className="card-title d-flex flex-column">
                                <span className="fs-2hx fw-bold text-primary me-2 lh-1 ls-n2">
                                    <KTIcon iconName="controller" className="fs-1" />
                                </span>
                                <span className="text-gray-400 pt-1 fw-semibold fs-6">Sistema Ativo</span>
                            </div>
                        </CardHeader>
                    </Card>
                </Col>
            </Row>

            {/* Main Content Row */}
            <Row className="g-5 g-xl-8">
                {/* Ranking Table */}
                <Col xl={6}>
                    <Card>
                        <CardHeader>
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-dark">Top 10 Usuários</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">Ranking por XP</span>
                            </h3>
                        </CardHeader>
                        <CardBody className="py-3">
                            <div className="table-responsive">
                                <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-50px">#</th>
                                            <th className="min-w-150px">Usuário</th>
                                            <th className="min-w-80px text-end">XP</th>
                                            <th className="min-w-80px text-end">Nível</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ranking?.map((user: RankingUser, idx: number) => (
                                            <tr key={user.userId}>
                                                <td>
                                                    <span className="badge badge-light-primary fs-7 fw-bold">{idx + 1}</span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        {user.avatarUrl && (
                                                            <div className="symbol symbol-35px me-3">
                                                                <img src={user.avatarUrl} alt={user.name} />
                                                            </div>
                                                        )}
                                                        <span className="text-dark fw-bold">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <span className="text-dark fw-bold">{user.xp}</span>
                                                </td>
                                                <td className="text-end">
                                                    <span className="badge badge-light-success">{user.level}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>
                </Col>

                {/* Pie Chart - Distribution */}
                <Col xl={6}>
                    <Card>
                        <CardHeader>
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-dark">Distribuição por Tipo de Ação</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">XP por categoria</span>
                            </h3>
                        </CardHeader>
                        <CardBody>
                            {!loadingActionTypes && actionTypes && actionTypes.length > 0 ? (
                                <ReactApexChart options={pieOptions} series={pieSeries} type="pie" height={300} />
                            ) : (
                                <div className="text-center py-10 text-muted">Carregando...</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>

            {/* Heatmap Line Chart */}
            <Row className="g-5 g-xl-8 mt-5">
                <Col xl={12}>
                    <Card>
                        <CardHeader>
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-dark">XP Distribuído (Últimos 30 Dias)</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">Tendência de engajamento</span>
                            </h3>
                        </CardHeader>
                        <CardBody>
                            {!loadingHeatmap && heatmap && heatmap.length > 0 ? (
                                <ReactApexChart options={lineOptions} series={lineSeries} type="line" height={350} />
                            ) : (
                                <div className="text-center py-10 text-muted">Carregando...</div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Content>
    )
}

export default GamificationDashboard
