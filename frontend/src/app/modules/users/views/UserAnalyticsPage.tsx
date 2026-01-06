import React, { useEffect, useState } from 'react'
import { PageTitle } from 'src/layout/core'
import { getUserAnalytics } from '../services/usersService'
import Chart from 'react-apexcharts'
import { useAuth } from 'src/app/modules/auth'

export function UserAnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { currentUser } = useAuth()
    const API_URL = import.meta.env.VITE_APP_API_URL

    useEffect(() => {
        getUserAnalytics()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div>Carregando estatísticas...</div>
    if (!data) return <div>Erro ao carregar dados.</div>

    const {
        users = { total: 0, registered: 0, active: 0, engaged: 0, activeRate: 0, engagedRate: 0 },
        engagement = { reactions: 0, comments: 0, shares: 0 },
        activitySeries = [],
        interactions = { likes: 0, comments: 0, shares: 0 },
        heatmap = []
    } = data || {}

    // --- Charts Configuration ---

    // 1. User Activity (Line Chart)
    const activityOptions: any = {
        chart: { type: 'area', toolbar: { show: false } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: activitySeries.map((s: any) => s.date),
            labels: { show: false } // Hide labels for cleaner look like reference
        },
        yaxis: { show: false }, // Hide y-axis
        grid: { show: false }, // Hide grid
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.9, stops: [0, 90, 100] } },
        colors: ['#009EF7', '#F1416C'], // Blue for Active, Red for Engaged
        tooltip: { x: { format: 'dd/MM/yy' } }
    }
    const activitySeriesData = [
        { name: 'Active Users', data: activitySeries.map((s: any) => s.active) },
        { name: 'Engaged Users', data: activitySeries.map((s: any) => s.engaged) }
    ]

    // 2. User Funnel (Bar Chart - Horizontal)
    const funnelOptions: any = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: '50%' } },
        dataLabels: { enabled: true, formatter: (val: number) => val },
        xaxis: { categories: ['Total Users', 'Registered Users', 'Active Users', 'Engaged Users'] },
        colors: ['#009EF7']
    }
    const funnelSeries = [{
        name: 'Users',
        data: [users.total, users.registered, users.active, users.engaged]
    }]

    // 3. User Interactions (Donut Chart)
    const interactionsOptions: any = {
        chart: { type: 'donut' },
        labels: ['Likes', 'Comments', 'Shares'],
        colors: ['#50CD89', '#FFC700', '#009EF7'], // Green, Yellow, Blue
        plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Interactions', fontSize: '16px', fontWeight: 600 } } } } },
        dataLabels: { enabled: false },
        legend: { position: 'bottom' }
    }
    const interactionsSeries = [interactions.likes, interactions.comments, interactions.shares]

    // 4. Heatmap (Active Users by Time)
    // Prepare heatmap data: 7 days x 24 hours
    const heatmapSeries = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (let d = 0; d < 7; d++) {
        const dayData = []
        for (let h = 0; h < 24; h++) {
            const point = heatmap.find((p: any) => p.dow === d && p.hour === h)
            dayData.push({ x: `${h}:00`, y: point ? point.count : 0 })
        }
        heatmapSeries.push({ name: days[d], data: dayData })
    }

    const heatmapOptions: any = {
        chart: { type: 'heatmap', toolbar: { show: false } },
        dataLabels: { enabled: false },
        colors: ['#009EF7'],
        xaxis: { labels: { show: true } },
        plotOptions: { heatmap: { shadeIntensity: 0.5, radius: 0, useFillColorAsStroke: true, colorScale: { ranges: [{ from: 0, to: 0, color: '#F5F8FA', name: '0 users' }] } } }
    }

    const handleExport = () => {
        const { auth } = useAuth()
        const token = auth?.api_token
        // Direct download link
        // We need to pass auth token. Since it's a GET link, we might need to use fetch and blob.
        // For simplicity, let's try fetch with blob.
        fetch(`${API_URL}/v2/analytics/users/export`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'user_activity.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(console.error)
    }

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-5">
                <PageTitle breadcrumbs={[]}>Estatísticas de Usuários</PageTitle>
                <button className="btn btn-sm btn-light-primary" onClick={handleExport}>
                    <i className="bi bi-download me-2"></i>
                    CSV export
                </button>
            </div>

            {/* Summary Cards */}
            <div className="row g-5 g-xl-8 mb-5">
                <div className="col-xl-3">
                    <div className="card bg-body hoverable card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <div className="text-gray-900 fw-bolder fs-2 mb-2 mt-5">{users.total}</div>
                            <div className="fw-bold text-gray-400">Total Users</div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3">
                    <div className="card bg-body hoverable card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <div className="text-gray-900 fw-bolder fs-2 mb-2 mt-5">{users.registered}</div>
                            <div className="fw-bold text-gray-400">Registered Users</div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3">
                    <div className="card bg-body hoverable card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <div className="text-gray-900 fw-bolder fs-2 mb-2 mt-5">{users.active}</div>
                            <div className="fw-bold text-gray-400">Active Users</div>
                            <div className={`badge badge-light-${users.activeRate > 0 ? 'success' : 'danger'} mt-1`}>
                                {users.activeRate}%
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-3">
                    <div className="card bg-body hoverable card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <div className="text-gray-900 fw-bolder fs-2 mb-2 mt-5">{users.engaged}</div>
                            <div className="fw-bold text-gray-400">Engaged Users</div>
                            <div className={`badge badge-light-${users.engagedRate > 0 ? 'success' : 'danger'} mt-1`}>
                                {users.engagedRate}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Activity Chart */}
            <div className="card card-xl-stretch mb-xl-8">
                <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bolder fs-3 mb-1">User Activity</span>
                    </h3>
                </div>
                <div className="card-body py-3">
                    <Chart options={activityOptions} series={activitySeriesData} type="area" height={350} />
                </div>
            </div>

            <div className="row g-5 g-xl-8">
                {/* User Funnel */}
                <div className="col-xl-6">
                    <div className="card card-xl-stretch mb-xl-8">
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bolder fs-3 mb-1">User Funnel</span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <Chart options={funnelOptions} series={funnelSeries} type="bar" height={350} />
                        </div>
                    </div>
                </div>

                {/* User Interactions */}
                <div className="col-xl-6">
                    <div className="card card-xl-stretch mb-xl-8">
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bolder fs-3 mb-1">User Interactions</span>
                            </h3>
                        </div>
                        <div className="card-body py-3 d-flex justify-content-center">
                            <Chart options={interactionsOptions} series={interactionsSeries} type="donut" height={350} />
                        </div>
                        <div className="card-footer d-flex justify-content-around">
                            <div className="text-center">
                                <div className="fs-2 fw-bolder text-gray-800">{interactions.likes}</div>
                                <div className="text-gray-400 fw-bold">Likes</div>
                            </div>
                            <div className="text-center">
                                <div className="fs-2 fw-bolder text-gray-800">{interactions.comments}</div>
                                <div className="text-gray-400 fw-bold">Comments</div>
                            </div>
                            <div className="text-center">
                                <div className="fs-2 fw-bolder text-gray-800">{interactions.shares}</div>
                                <div className="text-gray-400 fw-bold">Shares</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Heatmap */}
            <div className="card card-xl-stretch mb-xl-8">
                <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bolder fs-3 mb-1">Active Users by Time</span>
                    </h3>
                </div>
                <div className="card-body py-3">
                    <Chart options={heatmapOptions} series={heatmapSeries} type="heatmap" height={350} />
                </div>
            </div>
        </>
    )
}
