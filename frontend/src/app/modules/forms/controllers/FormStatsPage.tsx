// src/app/modules/forms/controllers/FormStatsPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FormsApi, TranslatableString } from '../services/api';
import {
  Card,
  Spinner,
  Tabs,
  Tab,
  Table,
  Button,
  Alert,
  Tooltip,
  OverlayTrigger,
} from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import WordCloudCanvas from '../components/WordCloudCanvas';

// 1. Mapa de Tradução (UX Polished)
const FIELD_TYPE_TRANSLATIONS: Record<string, string> = {
  short_text: 'Texto Curto',
  long_text: 'Texto Longo',
  number: 'Numérico',
  date: 'Data',
  single_choice: 'Escolha Única',
  multi_choice: 'Múltipla Escolha',
  stars: 'Avaliação (Estrelas)',
  scale: 'Escala (NPS)',
};

type StatsData = {
  form: {
    title: TranslatableString | string;
    defaultLocale?: string;
    [key: string]: any;
  };
  kpis: {
    totalQuestions: number;
    uniqueUsers: number;

    [key: string]: any;
    firstResponseMsP50?: number;
    eligibles?: number;
    impressions?: number;
    opens?: number;
    starts?: number;
    submissions: number;
    pendingForRh: number;
    rhReplies: number;
  };
  series: { [key: string]: any[] };
  segments: { [key: string]: any[] };
  reminders: Array<{
    kind: string;
    sent: number;
    opened: number;
    submitsAfter: number;
  }>;
  heatmap: Array<{ day: number; hour: number; count: number }>;
  globalWordCloud: {
    topWords: Array<{ word: string; count: number }>;
    bigrams: Array<{ phrase: string; count: number }>;
    trigrams: Array<{ phrase: string; count: number }>;
  };
};

type FieldStat = {
  fieldId: string;
  label: TranslatableString | string;
  type: string;
  metrics: { [key: string]: number };
  distribution?: { choices: Array<{ value: any; count: number }> };
  topWords?: Array<{ word: string; count: number }>;
  bigrams?: Array<{ phrase: string; count: number }>;
  trigrams?: Array<{ phrase: string; count: number }>;
};

type SegmentationData = {
  spaces: Array<{ id: string; name: string }>;
  groups: Array<{ id: string; name: string }>;
};

type AuditLog = {
  id: string;
  createdAt: string;
  actorUserId: string;
  actorName?: string;
  action: string;
  changes?: any;
};

const AUDIT_ACTION_MAP: Record<string, string> = {
  form_created: 'Formulário Criado',
  form_updated: 'Formulário Atualizado',
  form_status_changed: 'Status Alterado',
  form_published: 'Formulário Publicado',
  form_duplicated: 'Formulário Duplicado',
  form_deleted: 'Formulário Apagado',
  form_push_sent: 'Push de Publicação Enviado',
  notification_settings_updated: 'E-mails de Notificação Atualizados',
  submission_replied: 'Envio Respondido (Legado)',
  submission_approved: 'Envio Aprovado',
  submission_rejected: 'Envio Rejeitado',
  submission_chat_sent: 'Mensagem de Chat Enviada',
  submission_chat_closed: 'Chat Encerrado',
};

const getAuditLogTranslation = (action: string) => {
  return AUDIT_ACTION_MAP[action] || action;
};

const toLocalDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};
const today = toLocalDateInput(new Date());
const sevenDaysAgo = toLocalDateInput(new Date(new Date().setDate(new Date().getDate() - 7)));

export default function FormStatsPage() {
  const { formId } = useParams<{ formId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsData | null>(null);
  const [fieldData, setFieldData] = useState<FieldStat[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    from: sevenDaysAgo,
    to: today,
    spaceId: '',
    groupId: '',
    audience: 'all',
  });
  const [segData, setSegData] = useState<SegmentationData>({ spaces: [], groups: [] });

  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillErr, setBackfillErr] = useState<string | null>(null);

  const [exportLoading, setExportLoading] = useState(false);

  const loadData = () => {
    if (!formId) return;
    setLoading(true);
    setErr(null);

    const queryParams = {
      ...filters,
      spaceId: filters.spaceId || undefined,
      groupId: filters.groupId || undefined,
    };

    Promise.all([
      FormsApi.analyticsStats(formId, queryParams),
      FormsApi.analyticsFields(formId, queryParams),
      segData.spaces.length === 0 ? FormsApi.segmentationOptions() : Promise.resolve(segData),
    ])
      .then(([res, fieldsRes, segs]) => {
        const kpis = {
          ...res.kpis,
          totalQuestions: (fieldsRes as FieldStat[]).length,
          uniqueUsers: res.kpis.uniqueUsers || 0,
          rhReplies: res.kpis.rhReplies || 0,

          onTimeRate: res.kpis.submissions > 0 ? res.kpis.onTime / res.kpis.submissions : 0,
          externalRate: res.kpis.submissions > 0 ? res.kpis.external / res.kpis.submissions : 0,
        };

        setData({ ...res, kpis });
        setFieldData(fieldsRes as FieldStat[]);

        if ((segs as any).spaces) setSegData(segs as SegmentationData);
      })
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, [formId, filters]);

  const handleBackfill = async () => {
    if (!formId) return;
    setBackfillLoading(true);
    setBackfillErr(null);
    try {
      const date = new Date(filters.to);
      for (let i = 0; i < 7; i++) {
        const dateStr = toLocalDateInput(new Date(new Date().setDate(date.getDate() - i)));
        await FormsApi.analyticsRunAggregation(dateStr, formId);
      }
      loadData();
    } catch (e: any) {
      setBackfillErr(e.message ?? 'Falha ao rodar agregação');
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await FormsApi.analyticsExport({
        formId: formId,
        format: 'xlsx',
        filters: { ...filters, spaceId: filters.spaceId || undefined, groupId: filters.groupId || undefined },
      });
    } catch (e: any) {
      setErr('Falha ao gerar exportação: ' + (e as any).message);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <Card>
        <Card.Body className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Carregando estatísticas…</span>
        </Card.Body>
      </Card>
    );
  }

  if (err) {
    return (
      <Card>
        <Card.Body>
          <div className="alert alert-danger mb-0">{err}</div>
        </Card.Body>
      </Card>
    );
  }

  if (!data) {
    return <div className="p-6">Sem dados para esse formulário.</div>;
  }

  const formTitle =
    (data.form.title as TranslatableString)?.[
    data.form.defaultLocale || 'pt-BR'
    ] ?? (data.form.title as string);

  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h1 className="mb-0 fs-2">{formTitle}</h1>
          <span className="text-muted">Estatísticas do formulário</span>
        </div>
        <div>
          <Button variant="light" onClick={handleExport} disabled={exportLoading} className="me-2">
            {exportLoading ? 'Gerando...' : 'Exportar XLSX'}
          </Button>
          <Link to={`/forms/${formId}/submissions`} className="btn btn-primary me-2">
            Ver Envios (Inbox)
          </Link>
          <Link to={`/forms/${formId}/edit`} className="btn btn-light">
            Editar Formulário
          </Link>
        </div>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-2">
              <label className="form-label">De:</label>
              <input type="date" className="form-control" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Até:</label>
              <input type="date" className="form-control" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} />
            </div>
            <div className="col-md-3">
              <label className="form-label">Space:</label>
              <select className="form-select" value={filters.spaceId} onChange={e => setFilters(f => ({ ...f, spaceId: e.target.value }))}>
                <option value="">Todos os Spaces</option>
                {segData.spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Grupo:</label>
              <select className="form-select" value={filters.groupId} onChange={e => setFilters(f => ({ ...f, groupId: e.target.value }))}>
                <option value="">Todos os Grupos</option>
                {segData.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Audiência:</label>
              <select className="form-select" value={filters.audience} onChange={e => setFilters(f => ({ ...f, audience: e.target.value as any }))}>
                <option value="all">Todos</option>
                <option value="internal">Interno</option>
                <option value="external">Externo</option>
              </select>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Alert variant="info" className="d-flex justify-content-between align-items-center">
        <div>
          As estatísticas são agregadas diariamente (às 2:00). Para dados em tempo real, use o botão ao lado.
          {backfillErr && <div className="text-danger small mt-1">{backfillErr}</div>}
        </div>
        <Button variant="info" onClick={handleBackfill} disabled={backfillLoading}>
          {backfillLoading ? <Spinner size="sm" /> : 'Atualizar Agora'}
        </Button>
      </Alert>

      <Tabs defaultActiveKey="overview" className="mb-3" id="forms-stats-tabs">
        <Tab eventKey="overview" title="Visão Geral">
          <OverviewTab data={data} />
        </Tab>
        <Tab eventKey="questions" title="Perguntas (Resumo)">
          <QuestionsTab
            fieldData={fieldData}
            loading={loading}
            error={err}
            defaultLocale={data.form.defaultLocale || 'pt-BR'}
          />
        </Tab>
        <Tab eventKey="fields" title="Análise (Fricção)">
          <FieldsAnalysisTab
            fieldData={fieldData}
            loading={loading}
            error={err}
            defaultLocale={data.form.defaultLocale || 'pt-BR'}
          />
        </Tab>
        <Tab eventKey="segments" title="Segmentação">
          <SegmentsTab data={data} />
        </Tab>
        <Tab eventKey="reminders" title="Lembretes">
          <RemindersTab data={data} />
        </Tab>
        <Tab eventKey="logs" title="Logs de Auditoria">
          <AuditLogsTab formId={formId!} filters={filters} />
        </Tab>
      </Tabs>
    </>
  );
}

const Kpi = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="h-100">
    <Card.Body className="p-4">
      <div className="text-muted small text-uppercase">{title}</div>
      <div className="fs-3 fw-semibold">{value}</div>
    </Card.Body>
  </Card>
);

const formatPct = (n?: number) => `${((n ?? 0) * 100).toFixed(1)}%`;

const formatMsToHuman = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return 'N/A';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(0)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
};

const OverviewTab = ({ data }: { data: StatsData }) => {
  const kpis = data.kpis;
  const chartOptions: ApexCharts.ApexOptions = {
    chart: { type: 'area', height: 200, toolbar: { show: false } },
    xaxis: {
      categories: data.series.activity.map((d: any) => d.date),
      type: 'datetime',
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth' },
  };
  const chartSeries = [
    {
      name: 'Submissões',
      data: data.series.activity.map((d: any) => d.submissions),
    },
  ];

  const heatmapSeries = useMemo(() => {
    const daysOrder = [1, 2, 3, 4, 5, 6, 0];
    const dayLabels: Record<number, string> = { 0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb' };
    const base = new Map<string, number>();
    (data.heatmap ?? []).forEach(h => {
      base.set(`${h.day}-${h.hour}`, h.count);
    });
    return daysOrder.map(d => ({
      name: dayLabels[d],
      data: Array.from({ length: 24 }, (_, h) => ({ x: h.toString().padStart(2, '0'), y: base.get(`${d}-${h}`) || 0 }))
    }));
  }, [data.heatmap]);

  const heatmapOptions: ApexCharts.ApexOptions = {
    chart: { type: 'heatmap', toolbar: { show: false } },
    dataLabels: { enabled: false },
    plotOptions: { heatmap: { shadeIntensity: 0.5 } },
    xaxis: { title: { text: 'Hora do dia (UTC)' } },
    yaxis: { title: { text: 'Dia da semana' } },
  };

  const globalWords = data.globalWordCloud?.topWords ?? [];

  const funnelData = useMemo(() => {
    const k = data.kpis;
    return [
      { x: 'Elegíveis', y: k.eligibles || 0 },
      { x: 'Aberturas', y: k.opens || 0 },
      { x: 'Inícios', y: k.starts || 0 },
      { x: 'Envios', y: k.submissions || 0 },
    ].filter(d => d.y > 0).sort((a, b) => b.y - a.y);
  }, [data.kpis]);

  const funnelSeries = [{ name: 'Usuários', data: funnelData.map(d => d.y) }];
  const funnelCategories = funnelData.map(d => d.x);
  const funnelTotal = funnelData[0]?.y || 0;

  const funnelOptions: ApexCharts.ApexOptions = {
    chart: { type: 'bar', height: 300 },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
        distributed: true,
        dataLabels: {
          position: 'bottom',
        },
      },
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: ['#000'],
      },
      formatter: (val: number, opts: any) => {
        const label = opts.w.config.xaxis.categories[opts.dataPointIndex];
        let percent = '';
        if (funnelTotal > 0 && val > 0) {
          percent = `(${(val / funnelTotal * 100).toFixed(0)}%)`;
        }
        return `${label}: ${val} ${percent}`;
      },
      offsetX: 0,
      dropShadow: { enabled: true, color: '#fff', opacity: 0.7 },
    },
    xaxis: {
      categories: funnelCategories,
      labels: { show: false }
    },
    yaxis: {
      labels: { show: false }
    },
    title: {
      text: 'Funil de Conversão',
      align: 'left',
    },
    tooltip: {
      y: {
        title: {
          formatter: (seriesName: string) => seriesName,
        },
      },
    },
    legend: { show: false },
  };

  return (
    <div className="row g-4">
      <div className="col-md-3 col-6">
        <Kpi title="Total de Envios" value={kpis.submissions} />
      </div>
      <div className="col-md-3 col-6">
        <Kpi title="Pendentes p/ RH" value={kpis.pendingForRh} />
      </div>
      <div className="col-md-3 col-6">
        <Kpi title="Respostas do RH" value={kpis.rhReplies} />
      </div>
      <div className="col-md-3 col-6">
        <Kpi title="Tempo 1ª Resp. (P50)" value={formatMsToHuman(kpis.firstResponseMsP50)} />
      </div>

      <div className="col-md-3 col-6">
        <Kpi title="Total de Perguntas" value={kpis.totalQuestions} />
      </div>
      <div className="col-md-3 col-6">
        <Kpi title="Usuários Únicos" value={kpis.uniqueUsers} />
      </div>
      <div className="col-md-3 col-6">
        <Kpi title="Envios no Prazo" value={formatPct(kpis.onTimeRate)} />
      </div>
      <div className="col-md-3 col-6">
        <Kpi title="Uplift (Lembretes)" value={`${data.reminders.reduce((acc, r) => acc + r.submitsAfter, 0)} envios`} />
      </div>

      <div className="col-12">
        <Card>
          <Card.Body>
            {funnelData.length > 0 ? (
              <ReactApexChart
                options={funnelOptions}
                series={funnelSeries}
                type="bar"
                height={Math.max(250, funnelData.length * 60)}
              />
            ) : (
              <Alert variant="info" className="m-0">Sem dados de funil para exibir no período.</Alert>
            )}
          </Card.Body>
        </Card>
      </div>

      <div className="col-12">
        <Card>
          <Card.Header>
            <h5 className="card-title">Atividade (Envios/dia)</h5>
          </Card.Header>
          <Card.Body>
            <ReactApexChart
              options={chartOptions}
              series={chartSeries}
              type="area"
              height={200}
            />
          </Card.Body>
        </Card>
      </div>

      <div className="col-md-7">
        <Card>
          <Card.Header>
            <h5 className="card-title">Horários de Submissão (Dia/Hora UTC)</h5>
          </Card.Header>
          <Card.Body>
            {(data.heatmap ?? []).length > 0 ? (
              <ReactApexChart options={heatmapOptions} series={heatmapSeries} type="heatmap" height={360} />
            ) : (
              <div className="text-center text-muted p-4" style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Sem dados de heatmap no período.
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <div className="col-md-5">
        <Card>
          <Card.Header>
            <h5 className="card-title">WordCloud (Todas as Respostas)</h5>
          </Card.Header>
          <Card.Body>
            {globalWords.length > 0 ? (
              <div className="bg-light rounded d-flex align-items-center justify-content-center">
                <WordCloudCanvas
                  topWords={globalWords}
                  className="w-100"
                  heightRatio={1.0}
                  minHeight={360}
                  fontRange={[14, 60]}
                />
              </div>
            ) : (
              <div className="text-center text-muted p-4" style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Sem respostas de texto suficientes para gerar a nuvem de palavras.
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      <div className="col-md-6">
        <Card>
          <Card.Header>
            <h5 className="card-title">Ações do RH (por dia)</h5>
          </Card.Header>
          <Card.Body>
            <ReactApexChart
              options={{
                ...chartOptions,
                chart: { type: 'bar', height: 200, stacked: true },
              }}
              series={[
                {
                  name: 'Respostas',
                  data: data.series.rh.map((d: any) => d.replies),
                },
                {
                  name: 'Aprovações',
                  data: data.series.rh.map((d: any) => d.approvals),
                },
                {
                  name: 'Rejeições',
                  data: data.series.rh.map((d: any) => d.rejections),
                },
              ]}
              type="bar"
              height={200}
            />
          </Card.Body>
        </Card>
      </div>
      <div className="col-md-6">
        <Card>
          <Card.Header>
            <h5 className="card-title">Notificações (por dia)</h5>
          </Card.Header>
          <Card.Body>
            <ReactApexChart
              options={chartOptions}
              series={[
                {
                  name: 'Push Enviado',
                  data: data.series.notifications.map((d: any) => d.pushSent),
                },
                {
                  name: 'Push Aberto',
                  data: data.series.notifications.map((d: any) => d.pushOpened),
                },
              ]}
              type="area"
              height={200}
            />
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

const QuestionsTab = (
  { fieldData, loading, error, defaultLocale }:
    { fieldData: FieldStat[], loading: boolean, error: string | null, defaultLocale: string }
) => {
  if (loading) {
    return (
      <Card>
        <Card.Body className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Carregando perguntas...</span>
        </Card.Body>
      </Card>
    );
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const getLabel = (label: TranslatableString | string): string => {
    if (typeof label === 'string') return label;
    if (typeof label === 'object' && label !== null) {
      const t = label as TranslatableString;
      return t[defaultLocale] || t['pt-BR'] || t[Object.keys(t)[0]] || '';
    }
    return 'N/A';
  }

  const countResponses = (field: FieldStat) => {
    if (field.distribution?.choices) {
      return field.distribution.choices.reduce((acc, choice) => acc + choice.count, 0);
    }
    return 0;
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="card-title">Resumo por Pergunta</h5>
      </Card.Header>
      <Table striped responsive>
        <thead>
          <tr>
            <th>Título da Pergunta</th>
            <th>Tipo da Pergunta</th>
            <th className="text-end"># de Respostas</th>
          </tr>
        </thead>
        <tbody>
          {fieldData.map(field => (
            <tr key={field.fieldId}>
              <td>{getLabel(field.label)}</td>
              <td>
                <span className="badge badge-light">{FIELD_TYPE_TRANSLATIONS[field.type] || field.type}</span>
              </td>
              <td className="text-end fw-bold">{countResponses(field)}</td>
            </tr>
          ))}
          {fieldData.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center text-muted p-4">
                Nenhuma pergunta encontrada neste formulário.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
};


const SegmentsTab = ({ data }: { data: StatsData }) => {
  const segments = data.segments;
  return (
    <div className="row g-4">
      <div className="col-md-4">
        <Card>
          <Card.Header>
            <h5 className="card-title">Por Audiência</h5>
          </Card.Header>
          <Table striped>
            <tbody>
              {segments.byAudience.map((it: any) => (
                <tr key={it.type}>
                  <td>{it.type === 'internal' ? 'Interno' : 'Externo'}</td>
                  <td className="text-end fw-bold">{it.submits}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
      <div className="col-md-4">
        <Card>
          <Card.Header>
            <h5 className="card-title">Por Space</h5>
          </Card.Header>
          <Table striped>
            <tbody>
              {segments.bySpace.map((it: any) => (
                <tr key={it.spaceId}>
                  <td>{it.name ?? it.spaceId}</td>
                  <td className="text-end fw-bold">{it.submissions}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
      <div className="col-md-4">
        <Card>
          <Card.Header>
            <h5 className="card-title">Por Grupo</h5>
          </Card.Header>
          <Table striped>
            <tbody>
              {segments.byGroup.map((it: any) => (
                <tr key={it.groupId}>
                  <td>{it.name ?? it.groupId}</td>
                  <td className="text-end fw-bold">{it.submissions}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

const RemindersTab = ({ data }: { data: StatsData }) => {
  return (
    <Card>
      <Card.Header>
        <h5 className="card-title">Eficácia dos Lembretes</h5>
      </Card.Header>
      <Table striped>
        <thead>
          <tr>
            <th>Lembrete</th>
            <th className="text-end">Enviados</th>
            <th className="text-end">Abertos</th>
            <th className="text-end">Taxa Abertura</th>
            <th className="text-end">Envios Pós (48h)</th>
            <th className="text-end">Uplift (%)</th>
          </tr>
        </thead>
        <tbody>
          {data.reminders.map((it: any) => {
            const openRate = it.sent > 0 ? it.opened / it.sent : 0;
            const baselineSubmits = (it.sent - it.submitsAfter) * 0.1;
            const uplift = baselineSubmits > 0 ? (it.submitsAfter - baselineSubmits) / baselineSubmits : (it.submitsAfter > 0 ? 1 : 0);

            return (
              <tr key={it.kind}>
                <td>{it.kind}</td>
                <td className="text-end">{it.sent}</td>
                <td className="text-end">{it.opened}</td>
                <td className="text-end fw-bold">{formatPct(openRate)}</td>
                <td className="text-end fw-bold">{it.submitsAfter}</td>
                <td className="text-end fw-bold">{formatPct(uplift)}</td>
              </tr>
            );
          })}
          {data.reminders.length === 0 && (
            <tr>
              <td colSpan={6} className="text-muted text-center p-4">
                Nenhum lembrete configurado ou enviado para este formulário.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
};

const FieldsAnalysisTab = (
  { fieldData, loading, error, defaultLocale }:
    { fieldData: FieldStat[], loading: boolean, error: string | null, defaultLocale: string }
) => {

  if (loading) {
    return (
      <Card>
        <Card.Body className="d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" />
          <span>Analisando fricção e respostas...</span>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!fieldData || fieldData.length === 0) {
    return <Alert variant="info">Nenhuma pergunta encontrada para este formulário.</Alert>;
  }

  const getAverage = (choices: Array<{ value: any; count: number }>): number | null => {
    let sum = 0;
    let totalCount = 0;
    const allValues: number[] = [];
    choices.forEach(c => {
      const val = Number(c.value);
      const count = Number(c.count);
      if (!isNaN(val) && !isNaN(count)) {
        sum += val * count;
        totalCount += count;
        for (let i = 0; i < count; i++) allValues.push(val);
      }
    });
    return totalCount > 0 ? (sum / totalCount) : null;
  };

  const barOptions = (title: string, labels: string[]): ApexCharts.ApexOptions => ({
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '50%', distributed: true } },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const total = opts.w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
        const pct = (Number(val) / total) * 100;
        return `${val} (${pct.toFixed(0)}%)`;
      }
    },
    xaxis: { categories: labels, title: { text: 'Contagem' } },
    yaxis: { labels: { maxWidth: 200 } },
    legend: { show: false },
    title: { text: title },
  });

  const histOptions = (title: string, labels: string[], average: number | null): ApexCharts.ApexOptions => ({
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: '50%', distributed: true } },
    dataLabels: { enabled: true },
    xaxis: { categories: labels, title: { text: 'Valor' } },
    legend: { show: false },
    title: { text: title },
    annotations: average ? {
      yaxis: [
        {
          y: average,
          borderColor: '#FF4560',
          label: {
            borderColor: '#FF4560',
            style: { color: '#fff', background: '#FF4560' },
            text: `Média: ${average.toFixed(2)}`,
          },
        },
      ],
    } : {},
  });

  const findMedian = (numbers: number[]) => {
    if (numbers.length === 0) return 'N/A';
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return (
    <div className="d-flex flex-column gap-6">
      {fieldData.map(q => {
        const cardTitle = (q.label as TranslatableString)?.[defaultLocale] ?? (q.label as string);
        const hasDistribution = q.distribution && q.distribution.choices.length > 0;
        const hasWordCloud = q.topWords && q.topWords.length > 0;

        const metrics = q.metrics;
        const kpis = [
          { label: 'Interações', value: metrics.focus, tooltip: 'Nº de vezes que usuários clicaram ou focaram neste campo.' },
          { label: 'Mudanças', value: metrics.changes, tooltip: 'Nº de vezes que usuários alteraram o valor do campo.' },
          { label: 'Erros', value: metrics.validationErrors, tooltip: 'Nº de vezes que um erro de validação (ex: obrigatório) foi disparado.' },
          { label: 'Taxa de Erro', value: formatPct(metrics.errorRate), tooltip: '(Erros / Interações). Indica a dificuldade de preenchimento.' },
        ];

        // 2. Uso da tradução no título do Card
        const typeLabel = FIELD_TYPE_TRANSLATIONS[q.type] || q.type;

        if (q.type === 'single_choice' || q.type === 'multi_choice') {
          const labels = (q.distribution?.choices ?? []).map((c: any) => c.value);
          const data = (q.distribution?.choices ?? []).map((c: any) => c.count);
          return (
            <Card key={q.fieldId}>
              <Card.Header>
                <h5 className="card-title">
                  {cardTitle} <span className="text-muted fs-6 fw-normal">({typeLabel})</span>
                </h5>
              </Card.Header>
              <Card.Body>
                {hasDistribution ? (
                  <>
                    <ReactApexChart
                      options={barOptions('Distribuição de Respostas', labels)}
                      series={[{ name: 'Respostas', data }]}
                      type="bar"
                      height={Math.max(320, labels.length * 35)}
                    />
                    <KpiRow kpis={kpis} />
                  </>
                ) : (
                  <div className="text-muted text-center p-4">Sem respostas para esta pergunta.</div>
                )}
              </Card.Body>
            </Card>
          );
        }

        if (q.type === 'stars' || q.type === 'scale') {
          const average = getAverage(q.distribution?.choices ?? []);
          const allValues: number[] = [];
          (q.distribution?.choices ?? []).forEach((c: any) => {
            const val = Number(c.value);
            const count = Number(c.count);
            if (!isNaN(val) && !isNaN(count)) {
              for (let i = 0; i < count; i++) allValues.push(val);
            }
          });
          const median = findMedian(allValues);

          const labels = (q.distribution?.choices ?? []).map((c: any) => c.value.toString());
          const data = (q.distribution?.choices ?? []).map((c: any) => c.count);

          const fieldKpis = [
            ...kpis,
            { label: 'Média', value: average?.toFixed(2) ?? 'N/A', tooltip: 'Média aritmética das respostas.' },
            { label: 'Mediana', value: median, tooltip: 'O valor do meio (P50) das respostas.' },
          ];

          return (
            <Card key={q.fieldId}>
              <Card.Header>
                <h5 className="card-title">
                  {cardTitle} <span className="text-muted fs-6 fw-normal">({typeLabel})</span>
                </h5>
              </Card.Header>
              <Card.Body>
                {hasDistribution ? (
                  <>
                    <ReactApexChart
                      options={histOptions('Distribuição de Respostas', labels, average)}
                      series={[{ name: 'Qtd', data }]}
                      type="bar"
                      height={320}
                    />
                    <KpiRow kpis={fieldKpis} />
                  </>
                ) : (
                  <div className="text-muted text-center p-4">Sem respostas para esta pergunta.</div>
                )}
              </Card.Body>
            </Card>
          );
        }

        if (q.type === 'short_text' || q.type === 'long_text') {
          return (
            <Card key={q.fieldId}>
              <Card.Header>
                <h5 className="card-title">
                  {cardTitle} <span className="text-muted fs-6 fw-normal">({typeLabel})</span>
                </h5>
              </Card.Header>
              <Card.Body>
                {hasWordCloud ? (
                  <>
                    <div className="bg-light rounded d-flex align-items-center justify-content-center">
                      <WordCloudCanvas
                        topWords={q.topWords!}
                        className="w-100"
                        heightRatio={0.65}
                        minHeight={420}
                      />
                    </div>
                    {(q.bigrams?.length || q.trigrams?.length) ? (
                      <div className="row g-6 mt-4">
                        {q.bigrams?.length ? (
                          <div className="col-md-6">
                            <div className="fw-semibold mb-2">Top bigramas</div>
                            <div className="d-flex flex-wrap gap-2">
                              {q.bigrams.slice(0, 20).map(b => (
                                <span key={b.phrase} className="badge badge-light">
                                  {b.phrase} <span className="text-muted">({b.count})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {q.trigrams?.length ? (
                          <div className="col-md-6">
                            <div className="fw-semibold mb-2">Top trigramas</div>
                            <div className="d-flex flex-wrap gap-2">
                              {q.trigrams.slice(0, 20).map(t => (
                                <span key={t.phrase} className="badge badge-light">
                                  {t.phrase} <span className="text-muted">({t.count})</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <KpiRow kpis={kpis} />
                  </>
                ) : (
                  <div className="text-muted text-center p-4">Sem respostas de texto suficientes para gerar a nuvem de palavras.</div>
                )}
              </Card.Body>
            </Card>
          );
        }

        return (
          <Card key={q.fieldId}>
            <Card.Header>
              <h5 className="card-title">
                {cardTitle} <span className="text-muted fs-6 fw-normal">({typeLabel})</span>
              </h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">Sem visualização gráfica para este tipo de pergunta (Ex: Data, Número).</p>
              <KpiRow kpis={kpis} />
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

const AuditLogsTab = ({ formId, filters }: { formId: string, filters: any }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    FormsApi.analyticsGetLogs(formId, filters)
      .then((res: any) => setLogs(res.items))
      .catch(e => setErr(e.message || 'Falha ao carregar logs'))
      .finally(() => setLoading(false));
  }, [formId, filters]);

  if (loading) {
    return <Spinner animation="border" size="sm" />;
  }
  if (err) {
    return <Alert variant="danger">{err}</Alert>;
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="card-title">Logs de Auditoria do Formulário</h5>
      </Card.Header>
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Data</th>
            <th>Usuário (RH)</th>
            <th>Ação</th>
            <th>Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => {
            const actionText = getAuditLogTranslation(log.action);

            return (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.actorName || log.actorUserId}</td>
                <td>
                  <span className="badge bg-light text-dark">{actionText}</span>
                </td>
                <td>
                  {log.changes ? <pre className="mb-0" style={{ fontSize: '0.75rem' }}>{JSON.stringify(log.changes, null, 2)}</pre> : 'N/A'}
                </td>
              </tr>
            );
          })}
          {logs.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-muted p-4">
                Nenhum log de auditoria encontrado para este formulário no período selecionado.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
}

const KpiRow = ({ kpis }: { kpis: Array<{ label: string, value: any, tooltip?: string }> }) => (
  <div className="mt-4 pt-4 border-top">
    <div className="row g-4">
      {kpis.map(k => (
        <div className="col-md-3 col-6" key={k.label}>
          <div className="text-muted small text-uppercase d-flex align-items-center">
            <span>{k.label}</span>
            {k.tooltip && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id={`tooltip-${k.label}`}>{k.tooltip}</Tooltip>}
              >
                <span className="ms-1" style={{ cursor: 'pointer', fontStyle: 'normal' }}>
                  ⓘ
                </span>
              </OverlayTrigger>
            )}
          </div>
          <div className="fs-4 fw-semibold">{k.value}</div>
        </div>
      ))}
    </div>
  </div>
);
