
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { get9BoxDistribution, getCompetenciesRadar } from '../services/performanceService';
import TurnoverRiskWidget from '../components/TurnoverRiskWidget';
import { PerformanceEvolutionChart } from '../components/PerformanceEvolutionChart';
import { Content } from 'src/layout/components/Content';

const PerformanceDashboard: React.FC = () => {
    const [boxData, setBoxData] = useState<any[]>([]);
    const [radarData, setRadarData] = useState<any[]>([]);

    useEffect(() => {
        get9BoxDistribution().then(setBoxData);
        getCompetenciesRadar().then(setRadarData);
    }, []);

    const boxOptions: ApexCharts.ApexOptions = {
        chart: { type: 'treemap' },
        title: { text: 'Distribuição 9-Box' },
    };

    const radarOptions: ApexCharts.ApexOptions = {
        chart: { type: 'radar' },
        title: { text: 'Média de Competências (Radar)' },
        xaxis: { categories: radarData.map(d => d.competence) }
    };

    return (
        <Content>
            <TurnoverRiskWidget />

            <div className="row g-5 g-xl-8">
                <div className="col-xl-6">
                    <div className="card card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <ReactApexChart
                                options={boxOptions}
                                series={[{ data: boxData.map(b => ({ x: b.label, y: b.count })) }]}
                                type="treemap"
                                height={350}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="card card-xl-stretch mb-xl-8">
                        <div className="card-body">
                            <ReactApexChart
                                options={radarOptions}
                                series={[{ name: 'Score Médio', data: radarData.map(d => d.score) }]}
                                type="radar"
                                height={350}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <PerformanceEvolutionChart />
        </Content>
    );
};

export default PerformanceDashboard;
