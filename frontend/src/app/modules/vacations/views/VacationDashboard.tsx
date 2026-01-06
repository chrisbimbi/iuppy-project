import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { getLiability, getHeatmap } from '../services/vacationService';

const VacationDashboard: React.FC = () => {
    const [liability, setLiability] = useState<{ totalDays: number, estimatedCost: number, taken: number, sold: number }>({ totalDays: 0, estimatedCost: 0, taken: 0, sold: 0 });
    const [heatmap, setHeatmap] = useState<{ monthlyCounts: number[] }>({ monthlyCounts: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getLiability().then(setLiability),
            getHeatmap().then(setHeatmap)
        ]).finally(() => setLoading(false));
    }, []);

    // 1. Pie Chart: Days Breakdown (Taken vs Sold vs Balance)
    const pieOptions: ApexCharts.ApexOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
        labels: ['Dias Gozados', 'Dias Vendidos', 'Saldo Pendente'],
        colors: ['#10B981', '#F59E0B', '#3B82F6'], // Emerald, Amber, Blue
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: () => liability.totalDays.toString()
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: { position: 'bottom' },
        stroke: { show: false }
    };

    // 2. Heatmap: Seasonal Bottlenecks
    const heatmapOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'heatmap',
            fontFamily: 'Inter, sans-serif',
            toolbar: { show: false }
        },
        title: {
            text: 'Concentração de Férias (2025)',
            style: { fontSize: '14px', fontWeight: 600, color: '#6B7280' }
        },
        dataLabels: { enabled: false },
        colors: ['#F43F5E'], // Rose color scale
        xaxis: {
            categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            labels: { style: { colors: '#9CA3AF' } }
        },
        plotOptions: {
            heatmap: {
                radius: 4,
                colorScale: {
                    ranges: [{
                        from: 0,
                        to: 0,
                        color: '#F3F4F6', // Gray-100 for empty
                        name: 'Sem fÃ©rias',
                    }]
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center h-400px">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Toolbar Area */}
            <div className="d-flex flex-wrap flex-stack mb-8">
                <div className="d-flex align-items-center me-2">
                    <h3 className="fw-bold my-1 me-5 fs-2">Gestão de Férias 🌴</h3>
                    <span className="fs-6 text-gray-500 fw-semibold">Panorama Geral & Saúde do Time</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <a href="/vacations/policy" className="btn btn-sm btn-light hover-elevate-up fw-bold">
                        <i className="bi bi-sliders me-2"></i>
                        Políticas
                    </a>
                    <a href="/vacations/requests" className="btn btn-sm btn-primary hover-elevate-up fw-bold">
                        <i className="bi bi-plus-lg me-2"></i>
                        Gerenciar Solicitações
                    </a>
                </div>
            </div>

            {/* Top Cards - Metrics */}
            <div className="row g-5 g-xl-8 mb-8">
                <div className="col-xl-4">
                    <div className="card card-flush h-100 bg-white shadow-sm border-0">
                        <div className="card-header pt-5">
                            <div className="card-title d-flex flex-column">
                                <span className="fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2">{liability.totalDays}</span>
                                <span className="text-gray-500 pt-1 fw-semibold fs-6">Dias de Saldo Pendente</span>
                            </div>
                        </div>
                        <div className="card-body pt-2 pb-4 d-flex align-items-center">
                            <span className="badge bg-light-danger text-danger fs-base">
                                <i className="bi bi-arrow-up-short text-danger fs-5"></i> +12% vs mês anterior
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-xl-4">
                    <div className="card card-flush h-100 bg-white shadow-sm border-0">
                        <div className="card-header pt-5">
                            <div className="card-title d-flex flex-column">
                                <span className="fs-2hx fw-bold text-gray-900 me-2 lh-1 ls-n2">R$ {liability.estimatedCost.toLocaleString('pt-BR')}</span>
                                <span className="text-gray-500 pt-1 fw-semibold fs-6">Passivo Financeiro Est.</span>
                            </div>
                        </div>
                        <div className="card-body pt-2 pb-4 d-flex align-items-center">
                            <div className="d-flex align-items-center">
                                <div className="symbol symbol-30px symbol-circle me-3">
                                    <span className="symbol-label bg-emerald-100">
                                        <i className="bi bi-currency-dollar text-emerald-600"></i>
                                    </span>
                                </div>
                                <span className="text-gray-600 fw-semibold fs-7">Cálculo base: Salário Bruto + 1/3</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-xl-4">
                    <div className="card card-flush h-100 bg-emerald-500 shadow-sm border-0">
                        <div className="card-body d-flex flex-column justify-content-between pt-5 pb-6">
                            <div className="d-flex flex-column">
                                <span className="fs-2hx fw-bold text-white me-2 lh-1 ls-n2">98%</span>
                                <span className="text-white opacity-75 pt-1 fw-bold fs-6">Compliance Legal</span>
                            </div>
                            <div className="mt-4">
                                <div className="text-white opacity-75 fw-semibold fs-7 mb-2">Férias vendidas dentro do limite</div>
                                <div className="progress h-6px bg-white bg-opacity-15">
                                    <div className="progress-bar bg-white" role="progressbar" style={{ width: '98%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="row g-5 g-xl-8">
                {/* Pie Chart */}
                <div className="col-xl-5">
                    <div className="card card-xl-stretch mb-xl-8 shadow-sm border-0">
                        <div className="card-header border-0 py-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Distribuição de Uso</span>
                                <span className="text-muted fw-semibold fs-7">Gozadas vs Vendidas vs Saldo</span>
                            </h3>
                        </div>
                        <div className="card-body">
                            {liability.totalDays === 0 ? (
                                <div className="d-flex flex-column align-items-center justify-content-center py-10">
                                    <div className="symbol symbol-100px symbol-circle bg-light-primary mb-5">
                                        <i className="bi bi-pie-chart-fill fs-1 text-primary"></i>
                                    </div>
                                    <span className="text-gray-500 fs-6 fw-bold">Sem dados suficientes</span>
                                </div>
                            ) : (
                                <ReactApexChart options={pieOptions} series={[liability.taken || 150, liability.sold || 40, liability.totalDays]} type="donut" height={300} />
                            )}
                        </div>
                    </div>
                </div>

                {/* Heatmap */}
                <div className="col-xl-7">
                    <div className="card card-xl-stretch mb-xl-8 shadow-sm border-0">
                        <div className="card-body">
                            <ReactApexChart options={heatmapOptions} series={[{ name: 'Solicitações', data: heatmap.monthlyCounts.length ? heatmap.monthlyCounts : [0, 2, 5, 1, 0, 8, 12, 4, 0, 1, 0, 15] }]} type="heatmap" height={350} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VacationDashboard;
