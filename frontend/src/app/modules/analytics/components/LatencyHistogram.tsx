import React from 'react'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'

export default function LatencyHistogram({ data }: { data: { label: string; count: number }[] }) {
    const options: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: '55%' } },
        xaxis: {
            categories: data.map(d => d.label),
            title: { text: 'Faixa de latência' },
        },
        yaxis: {
            title: { text: 'Quantidade' },
            decimalsInFloat: 0,
        },
        dataLabels: { enabled: false },
        grid: { strokeDashArray: 3 },
        tooltip: { y: { formatter: (v) => `${v}` } },
    }

    const series = [{ name: 'Eventos', data: data.map(d => d.count) }]

    return (
        <div className="rounded-xl border p-3">
            <div className="text-sm fw-medium mb-2">Latência por faixa</div>
            <div style={{ height: 260 }}>
                <ReactApexChart options={options} series={series as any} type="bar" height={260} />
            </div>
        </div>
    )
}