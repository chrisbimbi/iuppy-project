import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import ReactApexChart from 'react-apexcharts';
import { PageTitle } from 'src/layout/core';
import { api } from 'src/app/api';
import { KTCard } from 'src/helpers/components/KTCard';
import WordCloud from 'react-d3-cloud';
import { Content } from 'src/layout/components/Content';

export const SocialAnalyticsPage: React.FC = () => {
    const intl = useIntl();
    const [stats, setStats] = useState<any>(null);
    const [heatmap, setHeatmap] = useState<any[]>([]);
    const [wordCloud, setWordCloud] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<{ topPosters: any[], topInteractors: any[] }>({ topPosters: [], topInteractors: [] });
    const [groupsLeaderboard, setGroupsLeaderboard] = useState<{ topGroupsPosts: any[], topGroupsInteractions: any[] }>({ topGroupsPosts: [], topGroupsInteractions: [] });
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        api.get('/social/analytics/dashboard').then(r => setStats(r.data));
        api.get('/social/analytics/heatmap').then(r => setHeatmap(r.data));
        api.get('/social/analytics/wordcloud').then(r => setWordCloud(r.data));
        api.get('/social/analytics/leaderboard').then(r => setLeaderboard(r.data));
        api.get('/social/analytics/leaderboard/groups').then(r => setGroupsLeaderboard(r.data));
        api.get('/social/analytics/posts').then(r => setPosts(r.data));
    }, []);

    const heatmapSeries = [0, 1, 2, 3, 4, 5, 6].map(day => {
        return {
            name: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day],
            data: Array.from({ length: 24 }, (_, hour) => {
                const found = heatmap.find((h: any) => Number(h.day) === day && Number(h.hour) === hour);
                return found ? Number(found.count) : 0;
            })
        };
    });

    return (
        <Content>
            <PageTitle breadcrumbs={[]}>Social Analytics & Dashboard</PageTitle>

            {/* KPI Cards */}
            <div className="row g-5 g-xl-8 mb-xl-8">
                <div className="col-xl-4">
                    <div className="card bg-info hoverable card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <div className="text-white fw-bold fs-2 mb-2 mt-5">{stats?.totalPosts || 0}</div>
                            <div className="fw-semibold text-white">Total Posts</div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-4">
                    <div className="card bg-success hoverable card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <div className="text-white fw-bold fs-2 mb-2 mt-5">{stats?.totalInteractions || 0}</div>
                            <div className="fw-semibold text-white">Interações (Likes/Comentários)</div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-4">
                    <div className="card bg-primary hoverable card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <div className="text-white fw-bold fs-2 mb-2 mt-5">{stats?.engagementRate || 0}</div>
                            <div className="fw-semibold text-white">Taxa de Engajamento/Post</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-5 g-xl-8">
                {/* Heatmap */}
                <div className="col-xl-6">
                    <KTCard>
                        <div className="card-body">
                            <h3 className="card-title mb-4">Mapa de Calor (Horário x Dia)</h3>
                            <ReactApexChart
                                options={{
                                    chart: { type: 'heatmap', toolbar: { show: false } },
                                    dataLabels: { enabled: false },
                                    colors: ['#008FFB'],
                                }}
                                series={heatmapSeries}
                                type="heatmap"
                                height={350}
                            />
                        </div>
                    </KTCard>
                </div>

                {/* Word Cloud */}
                <div className="col-xl-6">
                    <KTCard>
                        <div className="card-body">
                            <h3 className="card-title mb-4">Assuntos do Momento</h3>
                            <div style={{ height: 350 }}>
                                {wordCloud.length > 0 ? (
                                    <WordCloud
                                        data={wordCloud}
                                        rotate={(word) => word.value % 2 === 0 ? 0 : 90}
                                        fontSize={(word) => Math.log2(word.value) * 5 + 16}
                                    />
                                ) : (
                                    <div className="text-muted text-center pt-10">Sem dados suficientes</div>
                                )}
                            </div>
                        </div>
                    </KTCard>
                </div>
            </div>

            {/* Leaderboards */}
            <div className="row g-5 g-xl-8 mb-xl-8">
                <div className="col-xl-6">
                    <KTCard>
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Top Criadores</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">Usuários que mais postam</span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-150px">Usuário</th>
                                            <th className="min-w-100px text-end">Posts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.topPosters.map((item, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="symbol symbol-45px me-5">
                                                            <img src={item.user?.avatarUrl || `https://ui-avatars.com/api/?name=${item.user?.name || 'User'}&background=random`} alt="" />
                                                        </div>
                                                        <div className="d-flex justify-content-start flex-column">
                                                            <span className="text-dark fw-bold text-hover-primary fs-6">{item.user?.name || 'Usuário Removido'}</span>
                                                            <span className="text-muted fw-semibold text-muted d-block fs-7">{item.user?.jobTitle || ''}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <span className="text-dark fw-bold d-block fs-6">{item.count}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </KTCard>
                </div>
                <div className="col-xl-6">
                    <KTCard>
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Top Engajamento</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">Usuários que mais interagem</span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-150px">Usuário</th>
                                            <th className="min-w-100px text-end">Interações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.topInteractors.map((item, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="symbol symbol-45px me-5">
                                                            <img src={item.user?.avatarUrl || `https://ui-avatars.com/api/?name=${item.user?.name || 'User'}&background=random`} alt="" />
                                                        </div>
                                                        <div className="d-flex justify-content-start flex-column">
                                                            <span className="text-dark fw-bold text-hover-primary fs-6">{item.user?.name || 'Usuário Removido'}</span>
                                                            <span className="text-muted fw-semibold text-muted d-block fs-7">{item.user?.jobTitle || ''}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <span className="text-dark fw-bold d-block fs-6">{item.count}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </KTCard>
                </div>
            </div>

            {/* Group Leaderboards */}
            <div className="row g-5 g-xl-8 mb-xl-8">
                <div className="col-xl-6">
                    <KTCard>
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Top Grupos (Posts)</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">Grupos que mais publicam</span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-150px">Grupo</th>
                                            <th className="min-w-100px text-end">Posts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupsLeaderboard.topGroupsPosts.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td>
                                                    <span className="text-dark fw-bold text-hover-primary fs-6">{item.groupName}</span>
                                                </td>
                                                <td className="text-end">
                                                    <span className="text-dark fw-bold d-block fs-6">{item.count}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </KTCard>
                </div>
                <div className="col-xl-6">
                    <KTCard>
                        <div className="card-header border-0 pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Top Grupos (Engajamento)</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">Grupos que mais interagem</span>
                            </h3>
                        </div>
                        <div className="card-body py-3">
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th className="min-w-150px">Grupo</th>
                                            <th className="min-w-100px text-end">Interações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupsLeaderboard.topGroupsInteractions.map((item: any, i: number) => (
                                            <tr key={i}>
                                                <td>
                                                    <span className="text-dark fw-bold text-hover-primary fs-6">{item.groupName}</span>
                                                </td>
                                                <td className="text-end">
                                                    <span className="text-dark fw-bold d-block fs-6">{item.count}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </KTCard>
                </div>
            </div>

            {/* Post Performance Table */}
            <KTCard className="mb-5 mb-xl-8">
                <div className="card-header border-0 pt-5">
                    <h3 className="card-title align-items-start flex-column">
                        <span className="card-label fw-bold fs-3 mb-1">Performance por Post</span>
                        <span className="text-muted mt-1 fw-semibold fs-7">Métricas detalhadas dos últimos posts</span>
                    </h3>
                </div>
                <div className="card-body py-3">
                    <div className="table-responsive">
                        <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                            <thead>
                                <tr className="fw-bold text-muted">
                                    <th className="min-w-200px">Conteúdo / Autor</th>
                                    <th className="min-w-100px text-center">Data</th>
                                    <th className="min-w-80px text-center">Views</th>
                                    <th className="min-w-80px text-center">Likes</th>
                                    <th className="min-w-80px text-center">Comentários</th>
                                    <th className="min-w-80px text-center">Engajamento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map((post) => (
                                    <tr key={post.id}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <div className="symbol symbol-45px me-5">
                                                    {post.media && post.media.length > 0 && post.media[0].type === 'image' ? (
                                                        <img src={post.media[0].url} alt="" style={{ objectFit: 'cover' }} />
                                                    ) : (
                                                        <span className="symbol-label bg-light-primary text-primary fw-bold">TXT</span>
                                                    )}
                                                </div>
                                                <div className="d-flex justify-content-start flex-column">
                                                    <span className="text-dark fw-bold text-hover-primary fs-6" style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {post.content}
                                                    </span>
                                                    <span className="text-muted fw-semibold text-muted d-block fs-7">
                                                        por {post.author?.name}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-muted fw-semibold d-block fs-7">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-light fw-bold">{post.metrics.views}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-light-success fw-bold">{post.metrics.likes}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-light-info fw-bold">{post.metrics.comments}</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-light-primary fw-bold">{post.metrics.engagement}%</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </KTCard>

        </Content>
    );
};
