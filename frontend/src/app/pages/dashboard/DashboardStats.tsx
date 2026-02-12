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
import { VacationSummaryWidget } from './widgets/VacationSummaryWidget'
import { HRActionsWidget } from './widgets/HRActionsWidget'
import { PerformancePulseWidget } from './widgets/PerformancePulseWidget'
import { TurnoverStatsWidget } from './widgets/TurnoverStatsWidget'

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

            {/* Row 2: Top Users & Turnover Stats */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-8'>
                    <TopUsersWidget
                        className='card-xl-stretch mb-xl-8'
                        users={stats.users.topConnected || []}
                    />
                </div>
                <div className='col-xl-4'>
                    {stats.users.turnoverStats && (
                        <TurnoverStatsWidget className='card-xl-stretch mb-xl-8' stats={stats.users.turnoverStats} />
                    )}
                </div>
            </div>

            {/* Row 3: Performance & Vacation */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    {activeModules.includes('performance') && stats.performance && (
                        <div className='d-flex flex-column'>
                            <PerformanceWidget
                                className='card-xl-stretch mb-xl-8'
                                activeCycles={stats.performance.activeCycles || 0}
                                nineBoxDistribution={stats.performance.nineBoxDistribution || {}}
                            />
                            {stats.performance.completionStats && (
                                <PerformancePulseWidget
                                    className='card-xl-stretch mb-5'
                                    stats={stats.performance.completionStats}
                                />
                            )}
                        </div>
                    )}
                </div>
                <div className='col-xl-6'>
                    {activeModules.includes('vacations') && stats.vacations && (
                        <VacationSummaryWidget
                            className='card-xl-stretch mb-xl-8'
                            stats={{
                                awayNow: stats.vacations.awayNow,
                                pendingRequests: stats.vacations.pendingRequests,
                                awayUsersList: stats.vacations.awayUsersList
                            }}
                        />
                    )}
                    {stats.users.heatmap && (
                        <AccessHeatmapWidget className='card-xl-stretch mb-xl-8' heatmap={stats.users.heatmap} />
                    )}
                </div>
            </div>

            {/* Row 4: Gamification & HR Actions */}
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
                    {/* Aggregated HR Actions */}
                    <HRActionsWidget
                        className='card-xl-stretch mb-xl-8'
                        actions={[
                            {
                                title: 'Solicitações de Férias',
                                count: stats.vacations?.pendingRequests || 0,
                                link: '/vacations/requests',
                                icon: 'bi-sun',
                                color: 'warning'
                            },
                            {
                                title: 'Avaliações de Desempenho',
                                count: ((stats.performance?.completionStats?.manager.total || 0) - (stats.performance?.completionStats?.manager.submitted || 0)),
                                link: '/performance/assessments',
                                icon: 'bi-trophy',
                                color: 'primary'
                            },
                            {
                                title: 'Pendências NR-1',
                                count: stats.nr1?.training.overdue || 0,
                                link: '/nr1/dashboard',
                                icon: 'bi-shield-check',
                                color: 'danger'
                            }
                        ]}
                    />
                </div>
            </div>

            {/* Row 5: Reading Behavior & Search Stats */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    <ReadingBehaviorWidget className='card-xl-stretch mb-xl-8' />
                </div>
                <div className='col-xl-6'>
                    <SearchStatsWidget className='card-xl-stretch mb-xl-8' />
                </div>
            </div>

            {/* Row 6: Traffic & Chat */}
            <div className='row g-5 g-xl-8'>
                <div className='col-xl-6'>
                    <TrafficSourcesWidget className='card-xl-stretch mb-xl-8' />
                </div>
                <div className='col-xl-6'>
                    <ChatBehaviorWidget className='card-xl-stretch mb-xl-8' />
                </div>
            </div>

            {/* Row 7: Engagement & Journeys */}
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

            {/* Row 8: Forms & Polls */}
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

            {/* Row 9: News & Content Overview */}
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

            {/* Row 10: Social Stats & NR-1 */}
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
