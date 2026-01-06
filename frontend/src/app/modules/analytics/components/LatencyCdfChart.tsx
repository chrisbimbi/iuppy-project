import React from 'react'
import ReactApexChart from 'react-apexcharts'
import type { ApexOptions } from 'apexcharts'
import { useIntl } from 'react-intl'

type CDF = { x: number; y: number }[]
type Summary = { p50: number | null; p90: number | null }

export default function LatencyCdfChart({ data, summary }: { data: CDF; summary: Summary }) {
  const intl = useIntl()
  const options: ApexOptions = {
    chart: { type: 'line', toolbar: { show: false } },
    stroke: { curve: 'stepline', width: 3 },
    xaxis: {
      type: 'numeric',
      title: { text: intl.formatMessage({ id: 'ANALYTICS.LATENCY.CDF.X_AXIS' }) },
      labels: { formatter: (v) => `${Math.round(Number(v))}m` },
    },
    yaxis: {
      min: 0, max: 100, tickAmount: 5,
      title: { text: intl.formatMessage({ id: 'ANALYTICS.LATENCY.CDF.Y_AXIS' }) },
      labels: { formatter: (v) => `${Math.round(Number(v))}%` },
    },
    dataLabels: { enabled: false },
    grid: { strokeDashArray: 3 },
    tooltip: {
      x: { formatter: (v) => `${v} min` },
      y: { formatter: (v) => `${v}%` },
    },
    annotations: {
      xaxis: [
        ...(summary.p50 != null ? [{ x: summary.p50, label: { text: 'p50' }, strokeDashArray: 4 }] : []),
        ...(summary.p90 != null ? [{ x: summary.p90, label: { text: 'p90' }, strokeDashArray: 4 }] : []),
      ],
    },
  }

  const series = [
    { name: intl.formatMessage({ id: 'ANALYTICS.LATENCY.CDF.SERIES' }), data: data.map(p => [p.x, p.y]) },
  ]

  return (
    <div className="rounded-xl border p-3">
      <div className="text-sm fw-medium mb-2">{intl.formatMessage({ id: 'ANALYTICS.LATENCY.CDF.TITLE' })}</div>
      <div style={{ height: 260 }}>
        <ReactApexChart options={options} series={series as any} type="line" height={260} />
      </div>
    </div>
  )
}