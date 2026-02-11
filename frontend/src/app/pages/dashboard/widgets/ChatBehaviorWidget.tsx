import React, { useEffect, useState } from 'react'
import Chart from 'react-apexcharts'
import { getChatBehavior, ChatBehaviorResponse } from '../../../modules/analytics/core/_requests'
import { getCSSVariableValue } from '../../../../assets/ts/_utils/DomHelpers'

type Props = {
    className: string
}

const ChatBehaviorWidget: React.FC<Props> = ({ className }) => {
    const [data, setData] = useState<ChatBehaviorResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getChatBehavior()
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className={`card ${className} p-5`}>Carregando dados de chat...</div>
    if (!data) return <div className={`card ${className} p-5`}>Erro ao carregar dados</div>

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            fontFamily: 'inherit',
            type: 'area',
            height: 150,
            toolbar: { show: false },
            zoom: { enabled: false }
        },
        plotOptions: {},
        legend: { show: false },
        dataLabels: { enabled: false },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        stroke: {
            curve: 'smooth',
            show: true,
            width: 3,
            colors: [getCSSVariableValue('--bs-primary')]
        },
        xaxis: {
            categories: data.dailyVolume.map((v: any) => v.date),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { show: false }
        },
        yaxis: { show: false },
        states: {
            hover: { filter: { type: 'none' } },
            active: { allowMultipleDataPointsSelection: false, filter: { type: 'none' } }
        },
        tooltip: {
            style: { fontSize: '12px' },
            y: { formatter: (val) => `${val} mensagens` }
        },
        colors: [getCSSVariableValue('--bs-primary')],
        grid: {
            borderColor: getCSSVariableValue('--bs-gray-200'),
            strokeDashArray: 4,
            yaxis: { lines: { show: false } }
        }
    }

    const series = [{
        name: 'Volume',
        data: data.dailyVolume.map((v: any) => v.count)
    }]

    return (
        <div className={`card ${className}`}>
            <div className='card-header border-0 pt-5'>
                <h3 className='card-title align-items-start flex-column'>
                    <span className='card-label fw-bolder fs-3 mb-1'>Engajamento no Chat</span>
                    <span className='text-muted mt-1 fw-bold fs-7'>Volume de mensagens e retenção</span>
                </h3>
                <div className='card-toolbar'>
                    <span className='badge badge-light-primary fw-bolder px-4 py-3'>
                        {data.activeUsers} Ativos
                    </span>
                </div>
            </div>

            <div className='card-body pt-2'>
                {data.totalMessages === 0 ? (
                    <div className='d-flex flex-column align-items-center justify-content-center h-300px'>
                        <i className='bi bi-chat-dots fs-3x text-gray-200 mb-3'></i>
                        <span className='text-gray-400 fs-6 fw-bold'>Sem atividade de chat recente</span>
                    </div>
                ) : (
                    <div className='d-flex flex-column'>
                        {/* Top Stats Cards */}
                        <div className='row g-5 mb-8'>
                            <div className='col-6'>
                                <div className='bg-light-primary rounded p-5 h-100'>
                                    <span className='text-primary fw-bolder fs-2hx d-block'>{data.totalMessages}</span>
                                    <span className='text-gray-600 fw-bold fs-7'>Total Mensagens</span>
                                </div>
                            </div>
                            <div className='col-6'>
                                <div className='bg-light-success rounded p-5 h-100'>
                                    <span className='text-success fw-bolder fs-2hx d-block'>{data.insights.engagementRate.toFixed(1)}</span>
                                    <span className='text-gray-600 fw-bold fs-7'>Msgs/Usuário</span>
                                </div>
                            </div>
                        </div>

                        {/* Volume Chart */}
                        <div className='mb-8'>
                            <span className='text-gray-800 fw-bolder fs-6 d-block mb-1'>Volume Diário</span>
                            <div className='min-h-auto'>
                                <Chart options={chartOptions} series={series} type='area' height={150} />
                            </div>
                        </div>

                        {/* Attention Lists */}
                        <div className='row g-8'>
                            {/* Churn Risk */}
                            <div className='col-md-6'>
                                <div className='d-flex align-items-center mb-5'>
                                    <div className='symbol symbol-35px me-3'>
                                        <div className='symbol-label bg-light-danger'>
                                            <i className='bi bi-person-dash text-danger fs-3'></i>
                                        </div>
                                    </div>
                                    <span className='text-gray-800 fw-bolder fs-6'>Risco de Churn</span>
                                </div>
                                <div className='d-flex flex-column'>
                                    {data.lowActivityUsers.slice(0, 3).map((user: any, i: number) => (
                                        <div key={i} className='d-flex align-items-center mb-4'>
                                            <div className='symbol symbol-30px symbol-circle me-3'>
                                                <div className='symbol-label bg-light-danger text-danger fw-bold fs-8'>
                                                    {user.userName?.[0]}
                                                </div>
                                            </div>
                                            <div className='d-flex flex-column flex-grow-1'>
                                                <span className='text-gray-800 fw-bold fs-7'>{user.userName}</span>
                                                <span className='text-muted fs-9'>{user.daysSinceLastMessage ?? '??'} dias inativo</span>
                                            </div>
                                        </div>
                                    ))}
                                    {data.lowActivityUsers.length === 0 && (
                                        <span className='text-muted fs-8'>Nenhum usuário em risco 🎉</span>
                                    )}
                                </div>
                            </div>

                            {/* Conversation Types (Radial Pulse) */}
                            <div className='col-md-6'>
                                <div className='d-flex align-items-center mb-5'>
                                    <div className='symbol symbol-35px me-3'>
                                        <div className='symbol-label bg-light-info'>
                                            <i className='bi bi-diagram-2 text-info fs-3'></i>
                                        </div>
                                    </div>
                                    <span className='text-gray-800 fw-bolder fs-6'>Canais Ativos</span>
                                </div>
                                <div className='d-flex flex-column'>
                                    <div className='d-flex align-items-center mb-3'>
                                        <div className='flex-grow-1'>
                                            <span className='text-gray-800 fw-bold fs-7 d-block'>Grupos</span>
                                            <div className='progress h-5px mt-1'>
                                                <div className='progress-bar bg-primary' style={{ width: `${(data.conversationTypes.group / (data.activeConversations || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <span className='text-gray-800 fw-bolder fs-7 ms-3'>{data.conversationTypes.group}</span>
                                    </div>
                                    <div className='d-flex align-items-center'>
                                        <div className='flex-grow-1'>
                                            <span className='text-gray-800 fw-bold fs-7 d-block'>Diretas</span>
                                            <div className='progress h-5px mt-1'>
                                                <div className='progress-bar bg-success' style={{ width: `${(data.conversationTypes.direct / (data.activeConversations || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <span className='text-gray-800 fw-bolder fs-7 ms-3'>{data.conversationTypes.direct}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Media Pulse */}
                        <div className='separator separator-dashed my-8'></div>
                        <div className='d-flex flex-stack'>
                            <div className='d-flex align-items-center me-5'>
                                <i className='bi bi-mic fs-2 text-info me-2'></i>
                                <span className='text-gray-800 fw-bolder fs-7'>{data.messageTypes.voice} Audios</span>
                            </div>
                            <div className='d-flex align-items-center me-5'>
                                <i className='bi bi-image fs-2 text-success me-2'></i>
                                <span className='text-gray-800 fw-bolder fs-7'>{data.messageTypes.image} Imagens</span>
                            </div>
                            <div className='d-flex align-items-center'>
                                <i className='bi bi-clock-history fs-2 text-warning me-2'></i>
                                <span className='text-gray-800 fw-bolder fs-7'>{data.avgResponseTimeMinutes ?? '--'}m Resposta</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export { ChatBehaviorWidget }
