// src/app/modules/forms/controllers/FormsDashboardPage.tsx
import React from 'react';
import { FormsApi, TranslatableString } from '../services/api';
import { Card, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';

type OverviewData = {
  period: { from: string; to: string };
  kpis: {
    totalForms: number;
    totalQuestions: number;
    totalSubmissions: number;
    totalUniqueUsers: number;
    formsWithSubmissions: number;
    onTimeRate: number;
    externalRate: number;
    rhReplies?: number; // Marcado como opcional para evitar erros de tipagem se faltar
    rhResponseRate: number;
    attachmentsShare: number;
    backlog: number;
  };
  daily: Array<{ date: string; submissions: number }>;
  topForms: Array<{ formId: string; title: TranslatableString | string; submissions: number }>;
  topSpaces: Array<{ spaceId: string; name: string; submissions: number }>;
  topGroups: Array<{ groupId: string; name: string; submissions: number }>;
  topUsers: Array<{ userId: string; name: string; submissions: number }>;
};

export default function FormsDashboardPage() {
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    FormsApi.analyticsOverview({})
      .then((res) => setData(res as OverviewData))
      .catch((err) => console.error("Falha ao carregar dashboard", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="d-flex justify-content-center p-10"><Spinner animation="border" /></div>;
  if (!data) return <Card><Card.Body>Sem dados disponíveis.</Card.Body></Card>;

  const kpis = data.kpis;
  const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const getTitle = (t: any) => (typeof t === 'string' ? t : t?.['pt-BR'] || 'Formulário');

  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', height: 300, toolbar: { show: false } },
    xaxis: { categories: data.daily.map((d) => d.date), type: 'datetime', labels: { format: 'dd/MM' } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    colors: ['#009ef7'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } }
  };

  return (
    <div className="container-xxl">
      <div className="row g-5 g-xl-8">
        <KpiCard title="Total Formulários" value={kpis.totalForms} icon="bi-file-text" color="primary" />
        <KpiCard title="Total Envios" value={kpis.totalSubmissions} icon="bi-send" color="success" />
        <KpiCard title="Usuários Únicos" value={kpis.totalUniqueUsers} icon="bi-people" />
        <KpiCard title="Pendentes RH" value={kpis.backlog} icon="bi-clock-history" color="warning" />

        {/* 🔥 CORREÇÃO: Fallback seguro para evitar crash */}
        <KpiCard
          title="Respostas RH"
          value={(kpis.rhReplies ?? 0).toString()}
          icon="bi-reply-all"
        />

        <KpiCard title="Taxa Resposta" value={formatPct(kpis.rhResponseRate)} icon="bi-percent" />
        <KpiCard title="No Prazo" value={formatPct(kpis.onTimeRate)} icon="bi-check-circle" />

        <div className="col-xl-12">
          <Card className="card-xl-stretch shadow-sm border-0">
            <Card.Header className="border-0 pt-5"><h3 className="card-title">Volume de Envios</h3></Card.Header>
            <Card.Body><ReactApexChart options={chartOptions} series={[{ name: 'Envios', data: data.daily.map(d => d.submissions) }]} type="area" height={300} /></Card.Body>
          </Card>
        </div>

        <div className="col-xl-6">
          <Card className="card-xl-stretch shadow-sm border-0 h-100">
            <Card.Header className="border-0 pt-5"><h3 className="card-title">Top Formulários</h3></Card.Header>
            <Card.Body className="py-3"><div className="table-responsive"><Table className="align-middle gs-0 gy-4"><tbody>{data.topForms.slice(0, 5).map((it, idx) => <tr key={it.formId}><td className="ps-4"><Link to={`/forms/${it.formId}/stats`} className="text-dark fw-bolder text-hover-primary">{getTitle(it.title)}</Link></td><td className="text-end pe-4 fw-bolder">{it.submissions}</td></tr>)}</tbody></Table></div></Card.Body>
          </Card>
        </div>

        <div className="col-xl-6">
          <Card className="card-xl-stretch shadow-sm border-0 h-100">
            <Card.Header className="border-0 pt-5"><h3 className="card-title">Top Grupos</h3></Card.Header>
            <Card.Body className="py-3"><div className="table-responsive"><Table className="align-middle gs-0 gy-4"><tbody>{(data.topGroups || []).slice(0, 5).map((it) => <tr key={it.groupId}><td className="ps-4 fw-bolder text-gray-800">{it.name}</td><td className="text-end pe-4 fw-bolder">{it.submissions}</td></tr>)}</tbody></Table></div></Card.Body>
          </Card>
        </div>

        <div className="col-xl-6">
          <Card className="card-xl-stretch shadow-sm border-0 h-100">
            <Card.Header className="border-0 pt-5"><h3 className="card-title">Top Usuários</h3></Card.Header>
            <Card.Body className="py-3"><div className="table-responsive"><Table className="align-middle gs-0 gy-4"><tbody>{(data.topUsers || []).slice(0, 5).map((it) => <tr key={it.userId}><td className="ps-4 fw-bolder text-gray-800">{it.name}</td><td className="text-end pe-4 fw-bolder">{it.submissions}</td></tr>)}</tbody></Table></div></Card.Body>
          </Card>
        </div>

        <div className="col-xl-6">
          <Card className="card-xl-stretch shadow-sm border-0 h-100">
            <Card.Header className="border-0 pt-5"><h3 className="card-title">Spaces Engajados</h3></Card.Header>
            <Card.Body className="py-3"><div className="table-responsive"><Table className="align-middle gs-0 gy-4"><tbody>{data.topSpaces.slice(0, 5).map((it, idx) => <tr key={it.spaceId}><td className="ps-4"><span className="text-dark fw-bolder mb-1 fs-6">{it.name}</span></td><td className="text-end pe-4"><span className="text-dark fw-bolder d-block fs-6">{it.submissions}</span></td></tr>)}</tbody></Table></div></Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

const KpiCard = ({ title, value, color = 'dark', icon }: any) => (
  <div className="col-sm-6 col-xl-3">
    <Card className="h-100 hoverable shadow-sm border-0"><Card.Body className="p-4 d-flex flex-column justify-content-center"><span className="fw-bold fs-7 text-muted d-block">{title}</span><span className={`fw-bolder fs-2x text-${color}`}>{value}</span></Card.Body></Card>
  </div>
);