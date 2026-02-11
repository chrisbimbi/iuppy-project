import React, { useEffect, useState } from 'react'
import { getDashboardStats, DashboardStatsResponse } from '../../modules/analytics/core/_requests'
import { PageTitle } from '../../../layout/core'
import { useIntl } from 'react-intl'
import ReactApexChart from 'react-apexcharts'
import { getCSSVariableValue } from '../../../assets/ts/_utils/DomHelpers'
import { GamificationLeaderboardWidget } from './widgets/GamificationLeaderboardWidget'
import { Nr1StatsWidget } from './widgets/Nr1StatsWidget'
import { SocialStatsWidget } from './widgets/SocialStatsWidget'
import { UserStatsWidget } from './widgets/UserStatsWidget'
import { TopUsersWidget } from './widgets/TopUsersWidget'
import { NewsStatsWidget } from './widgets/NewsStatsWidget'
import { ContentOverviewWidget } from './widgets/ContentOverviewWidget'
import { PerformanceWidget } from './widgets/PerformanceWidget'

// ... imports remain the same ...

import { JourneysWidget } from './widgets/JourneysWidget'
import { GroupEngagementWidget } from './widgets/GroupEngagementWidget'
import { SearchStatsWidget } from './widgets/SearchStatsWidget'
import { ReadingBehaviorWidget } from './widgets/ReadingBehaviorWidget'
import { TrafficSourcesWidget } from './widgets/TrafficSourcesWidget'
import { ChatBehaviorWidget } from './widgets/ChatBehaviorWidget'
import { EngagementFunnelWidget } from './widgets/EngagementFunnelWidget'
import { FormsStatsWidget } from './widgets/FormsStatsWidget'
import { PollsStatsWidget } from './widgets/PollsStatsWidget'
import { Content } from '../../../layout/components/Content'
import { AccessHeatmapWidget } from './widgets/AccessHeatmapWidget'

export const DashboardStats: React.FC = () => {
    const intl = useIntl()
    const [data, setData] = useState<DashboardStatsResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDashboardStats()
            .then((res) => setData(res.data))
            .catch((err) => console.error(err))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="d-flex justify-content-center p-10">Carregando estatísticas...</div>
    if (!data) return <div>Não foi possível carregar os dados.</div>

    const { activeModules, stats } = data

    return (
        <Content>
            <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'MENU.DASHBOARD' })}</PageTitle>

            {/* Row 1: User Analytics Evolution (Full Width) */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-12'>
                    <UserStatsWidget stats={stats.users} />
                </div>
            </div>

            {/* Row 2: Top Users & Talent Density (Performance) */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    <TopUsersWidget
                        className='card-xl-stretch mb-xl-8'
                        users={stats.users.topConnected || []}
                    />
                </div>
                <div className='col-xl-6'>
                    <PerformanceWidget
                        className='card-xl-stretch mb-xl-8'
                        activeCycles={stats.performance?.activeCycles || 0}
                        nineBoxDistribution={stats.performance?.nineBoxDistribution || {}}
                    />
                </div>
            </div>

            {/* Row 3: Gamification & Access Heatmap */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    {activeModules.includes('gamification') && stats.gamification && (
                        <GamificationLeaderboardWidget
                            overview={stats.gamification}
                            ranking={stats.gamificationRanking}
                        />
                    )}
                </div>
                <div className='col-xl-6'>
                    {stats.users.heatmap && (
                        <AccessHeatmapWidget className='card-xl-stretch mb-xl-8' heatmap={stats.users.heatmap} />
                    )}
                </div>
            </div>

            {/* Row 3: Reading Behavior & Search Stats */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    <ReadingBehaviorWidget className='card-xl-stretch mb-xl-8' />
                </div>
                <div className='col-xl-6'>
                    <SearchStatsWidget className='card-xl-stretch mb-xl-8' />
                </div>
            </div>

            {/* Row 4: Traffic Sources & Chat Behavior */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    <TrafficSourcesWidget className='card-xl-stretch mb-xl-8' />
                </div>
                <div className='col-xl-6'>
                    <ChatBehaviorWidget className='card-xl-stretch mb-xl-8' />
                </div>
            </div>

            {/* Row 5: Engagement Funnel & Journeys */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    <EngagementFunnelWidget className='card-xl-stretch mb-xl-8' />
                </div>
                <div className='col-xl-6'>
                    {activeModules.includes('journeys') && stats.journeys && (
                        <JourneysWidget className='card-xl-stretch mb-xl-8' stats={stats.journeys} />
                    )}
                </div>
            </div>

            {/* Row 6: Forms & Polls */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    {activeModules.includes('forms') && stats.forms && (
                        <FormsStatsWidget className='card-xl-stretch mb-xl-8' stats={stats.forms} />
                    )}
                </div>
                <div className='col-xl-6'>
                    {(activeModules.includes('surveys') || activeModules.includes('polls')) && stats.surveys && (
                        <PollsStatsWidget className='card-xl-stretch mb-xl-8' stats={stats.surveys} />
                    )}
                </div>
            </div>

            {/* Row 7: Groups & Action Needed */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    {activeModules.includes('social') && stats.social && (
                        <GroupEngagementWidget
                            className='card-xl-stretch mb-xl-8'
                            topGroups={stats.social.topGroups}
                            bottomGroups={stats.social.bottomGroups}
                        />
                    )}
                </div>
                <div className='col-xl-6'>
                    {/* Action Needed Card */}
                    <div className='card card-flush h-xl-100 mb-xl-8 bg-body' style={{ border: '1px dashed #E1E3EA' }}>
                        <div className='card-header border-0 pt-5'>
                            <h3 className='card-title align-items-start flex-column'>
                                <span className='card-label fw-bolder text-dark'>Ações Necessárias</span>
                                <span className='text-muted mt-1 fw-bold fs-7'>Alertas e tarefas pendentes</span>
                            </h3>
                        </div>
                        <div className='card-body pt-2'>
                            <div className='d-flex flex-center position-relative mb-7 text-center'>
                                <div className='d-flex flex-column'>
                                    <span className='fs-2hx fw-bold text-gray-800'>74%</span>
                                    <span className='text-muted fs-8 fw-bold'>Eficiência Geral</span>
                                </div>
                            </div>

                            <div className='d-flex flex-column'>
                                <div className='d-flex align-items-center bg-light-danger rounded p-4 mb-4'>
                                    <div className='symbol symbol-30px me-4'>
                                        <div className='symbol-label bg-danger'>
                                            <i className='bi bi-exclamation-triangle-fill text-white fs-6'></i>
                                        </div>
                                    </div>
                                    <div className='flex-grow-1 me-2'>
                                        <span className='fw-bolder text-gray-800 text-hover-primary fs-7'>NR1 Pendente</span>
                                        <span className='text-muted fw-bold d-block fs-9'>5 atrasos</span>
                                    </div>
                                </div>

                                <div className='d-flex align-items-center bg-light-warning rounded p-4 mb-4'>
                                    <div className='symbol symbol-30px me-4'>
                                        <div className='symbol-label bg-warning'>
                                            <i className='bi bi-chat-dots-fill text-white fs-6'></i>
                                        </div>
                                    </div>
                                    <div className='flex-grow-1 me-2'>
                                        <span className='fw-bolder text-gray-800 text-hover-primary fs-7'>Conversas</span>
                                        <span className='text-muted fw-bold d-block fs-9'>12 novas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 8: News & Content Overview */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    {stats.news && (
                        <NewsStatsWidget
                            stats={{
                                totalNews: stats.news.totalNews,
                                topNews: (stats.news.items || []).slice(0, 3).map((item: any) => ({
                                    id: item.id,
                                    title: item.title,
                                    date: item.createdAt,
                                    cover: item.thumbnail || '',
                                    interactions: item.totalInteractions || 0
                                }))
                            }}
                        />
                    )}
                </div>
                <div className='col-xl-6'>
                    {(activeModules.includes('news') && stats.news) && (
                        <ContentOverviewWidget
                            className='card-xl-stretch mb-xl-8'
                            heatmapData={stats.news.heatmap}
                            heatmapViews={stats.news.heatmapViews}
                            heatmapEngagement={stats.news.heatmapEngagement}
                            channelsData={stats.news.channelEffectiveness}
                        />
                    )}
                </div>
            </div>

            {/* Row 9: Social Stats & NR-1 */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    {activeModules.includes('social') && stats.social && (
                        <SocialStatsWidget stats={stats.social} leaderboard={stats.social.topPosters} />
                    )}
                </div>
                <div className='col-xl-6'>
                    {activeModules.includes('nr1') && stats.nr1 && (
                        <Nr1StatsWidget stats={stats.nr1} />
                    )}
                </div>
            </div>
        </Content>
    )
}
