import React from 'react'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useIntl } from 'react-intl'

export default function LatencyHistogram({ data }: { data: { label: string; count: number }[] }) {
    const intl = useIntl()
    const options: ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: { bar: { columnWidth: '55%' } },
        xaxis: {
            categories: data.map(d => d.label),
            title: { text: intl.formatMessage({ id: 'ANALYTICS.LATENCY.HISTOGRAM.X_AXIS' }) },
        },
        yaxis: {
            title: { text: intl.formatMessage({ id: 'ANALYTICS.LATENCY.HISTOGRAM.Y_AXIS' }) },
            decimalsInFloat: 0,
        },
        dataLabels: { enabled: false },
        grid: { strokeDashArray: 3 },
        tooltip: { y: { formatter: (v) => `${v}` } },
    }

    const series = [{ name: intl.formatMessage({ id: 'ANALYTICS.LATENCY.HISTOGRAM.SERIES' }), data: data.map(d => d.count) }]

    return (
        <div className="rounded-xl border p-3">
            <div className="text-sm fw-medium mb-2">{intl.formatMessage({ id: 'ANALYTICS.LATENCY.HISTOGRAM.TITLE' })}</div>
            <div style={{ height: 260 }}>
                <ReactApexChart options={options} series={series as any} type="bar" height={260} />
            </div>
        </div>
    )
}