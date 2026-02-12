
import React, { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { getPerformanceEvolution } from '../services/performanceService';

export const PerformanceEvolutionChart: React.FC = () => {
    const [data, setData] = useState<{ cycleName: string; averageScore: number }[]>([]);

    useEffect(() => {
        getPerformanceEvolution().then(setData);
    }, []);

    const options: ApexCharts.ApexOptions = {
        chart: { type: 'line', toolbar: { show: false } },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: data.map(d => d.cycleName) },
        yaxis: { min: 0, max: 5 }, // Assuming 0-5 scale
        colors: ['#009EF7'],
        title: { text: 'Evolução de Performance (Média da Empresa)' }
    };

    return (
        <div className="card card-xl-stretch mb-xl-8">
            <div className="card-body">
                <ReactApexChart
                    options={options}
                    series={[{ name: 'Score Médio', data: data.map(d => d.averageScore) }]}
                    type="line"
                    height={350}
                />
            </div>
        </div>
    );
};
