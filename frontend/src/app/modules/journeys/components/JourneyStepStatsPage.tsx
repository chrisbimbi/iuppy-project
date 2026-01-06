import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStepAnalyticsStats, getStepAnalyticsFields, getStepSubmissions, exportStepSubmissions, downloadStepAttachments } from '../services/journeys.service';
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
    Modal,
} from 'react-bootstrap';
import ReactApexChart from 'react-apexcharts';
import { useIntl } from 'react-intl';
import WordCloudCanvas from '../../forms/components/WordCloudCanvas';

// Reuse translations from Forms module
const FIELD_TYPE_TRANSLATIONS: Record<string, string> = {
    short_text: 'FORMS.STATS.FIELD_TYPE.SHORT_TEXT',
    long_text: 'FORMS.STATS.FIELD_TYPE.LONG_TEXT',
    number: 'FORMS.STATS.FIELD_TYPE.NUMBER',
    date: 'FORMS.STATS.FIELD_TYPE.DATE',
    single_choice: 'FORMS.STATS.FIELD_TYPE.SINGLE_CHOICE',
    multi_choice: 'FORMS.STATS.FIELD_TYPE.MULTI_CHOICE',
    stars: 'FORMS.STATS.FIELD_TYPE.STARS',
    scale: 'FORMS.STATS.FIELD_TYPE.SCALE',
    file: 'FORMS.STATS.FIELD_TYPE.FILE',
};

// Helper to get label from object or string
const getLabel = (label: any, locale: string = 'pt-BR') => {
    if (!label) return '';
    if (typeof label === 'string') return label;
    if (typeof label === 'object') {
        return label[locale] || label['pt-BR'] || label['en-US'] || Object.values(label)[0] || JSON.stringify(label);
    }
    return String(label);
};

export default function JourneyStepStatsPage() {
    const intl = useIntl();
    const { journeyId, stepId } = useParams<{ journeyId: string; stepId: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any | null>(null);
    const [fieldData, setFieldData] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const loadData = () => {
        if (!journeyId || !stepId) return;
        setLoading(true);
        setErr(null);

        Promise.all([
            getStepAnalyticsStats(journeyId, stepId),
            getStepAnalyticsFields(journeyId, stepId),
            getStepSubmissions(journeyId, stepId)
        ])
            .then(([res, fieldsRes, subsRes]) => {
                setData(res);
                setFieldData(fieldsRes);
                setSubmissions(subsRes);
            })
            .catch((e) => setErr(String(e?.message || e)))
            .finally(() => setLoading(false));
    };

    useEffect(loadData, [journeyId, stepId]);

    const handleExport = async () => {
        try {
            const blob = await exportStepSubmissions(journeyId!, stepId!);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `submissions_${stepId}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            alert('Error exporting submissions');
        }
    };

    const handleDownloadAttachments = async () => {
        try {
            const blob = await downloadStepAttachments(journeyId!, stepId!);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attachments_${stepId}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (e) {
            alert('Error downloading attachments');
        }
    };

    if (loading && !data) {
        return (
            <Card>
                <Card.Body className="d-flex align-items-center gap-2">
                    <Spinner animation="border" size="sm" />
                    <span>{intl.formatMessage({ id: 'FORMS.STATS.LOADING.STATS' })}</span>
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
        return <div className="p-6">{intl.formatMessage({ id: 'FORMS.STATS.EMPTY.FORM' })}</div>;
    }

    const formTitle = getLabel(data.form.title);

    return (
        <div className="container-xxl">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="mb-0 fs-2">{formTitle}</h1>
                    <span className="text-muted">Journey Step Statistics</span>
                </div>
                <div className="d-flex gap-2">
                    <Button variant="light" onClick={handleExport}>
                        <i className="bi bi-file-earmark-excel me-2"></i> Export Excel
                    </Button>
                    <Button variant="light" onClick={handleDownloadAttachments}>
                        <i className="bi bi-file-zip me-2"></i> Download Attachments
                    </Button>
                    <Link to={`/journeys/${journeyId}/analytics`} className="btn btn-secondary">
                        Back to Analytics
                    </Link>
                </div>
            </div>

            <Tabs defaultActiveKey="overview" className="mb-3" id="forms-stats-tabs">
                <Tab eventKey="overview" title={intl.formatMessage({ id: 'FORMS.STATS.TAB.OVERVIEW' })}>
                    <OverviewTab data={data} />
                </Tab>
                <Tab eventKey="questions" title={intl.formatMessage({ id: 'FORMS.STATS.TAB.QUESTIONS' })}>
                    <QuestionsTab
                        fieldData={fieldData}
                        loading={loading}
                        error={err}
                        defaultLocale={data.form.defaultLocale || 'pt-BR'}
                    />
                </Tab>
                <Tab eventKey="fields" title={intl.formatMessage({ id: 'FORMS.STATS.TAB.FIELDS' })}>
                    <FieldsAnalysisTab
                        fieldData={fieldData}
                        loading={loading}
                        error={err}
                        defaultLocale={data.form.defaultLocale || 'pt-BR'}
                    />
                </Tab>
                <Tab eventKey="submissions" title="Submissions List">
                    <SubmissionsTab
                        submissions={submissions}
                        fieldData={fieldData}
                        onViewImage={(url) => {
                            setSelectedImage(url);
                            setShowImageModal(true);
                        }}
                    />
                </Tab>
            </Tabs>

            <Modal show={showImageModal} onHide={() => setShowImageModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Attachment</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center bg-light p-4">
                    {selectedImage && (
                        <img src={selectedImage} alt="Attachment" className="img-fluid rounded shadow-sm" style={{ maxHeight: '80vh' }} />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => window.open(selectedImage!, '_blank')}>
                        Download / Open Original
                    </Button>
                    <Button variant="secondary" onClick={() => setShowImageModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
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

const OverviewTab = ({ data }: { data: any }) => {
    const intl = useIntl();
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
            name: intl.formatMessage({ id: 'FORMS.STATS.CHART.SUBMISSIONS' }),
            data: data.series.activity.map((d: any) => d.submissions),
        },
    ];

    const heatmapSeries = useMemo(() => {
        const daysOrder = [1, 2, 3, 4, 5, 6, 0];
        const dayLabels: Record<number, string> = {
            0: intl.formatMessage({ id: 'FORMS.STATS.WEEKDAY.SUN' }),
            1: intl.formatMessage({ id: 'FORMS.STATS.WEEKDAY.MON' }),
            2: intl.formatMessage({ id: 'FORMS.STATS.WEEKDAY.TUE' }),
            3: intl.formatMessage({ id: 'FORMS.STATS.WEEKDAY.WED' }),
            4: intl.formatMessage({ id: 'FORMS.STATS.WEEKDAY.THU' }),
            5: intl.formatMessage({ id: 'FORMS.STATS.WEEKDAY.FRI' }),
            6: intl.formatMessage({ id: 'FORMS.STATS.WEEKDAY.SAT' })
        };
        const base = new Map<string, number>();
        (data.heatmap ?? []).forEach((h: any) => {
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
        xaxis: { title: { text: intl.formatMessage({ id: 'FORMS.STATS.CHART.HOUR_UTC' }) } },
        yaxis: { title: { text: intl.formatMessage({ id: 'FORMS.STATS.CHART.WEEKDAY' }) } },
    };

    const globalWords = data.globalWordCloud?.topWords ?? [];

    return (
        <div className="row g-4" >
            <div className="col-md-3 col-6">
                <Kpi title={intl.formatMessage({ id: 'FORMS.STATS.KPI.SUBMISSIONS' })} value={kpis.submissions} />
            </div>
            <div className="col-md-3 col-6">
                <Kpi title={intl.formatMessage({ id: 'FORMS.STATS.KPI.UNIQUE_USERS' })} value={kpis.uniqueUsers} />
            </div>
            <div className="col-md-3 col-6">
                <Kpi title={intl.formatMessage({ id: 'FORMS.STATS.KPI.TOTAL_QUESTIONS' })} value={kpis.totalQuestions} />
            </div>

            <div className="col-12">
                <Card>
                    <Card.Header>
                        <h5 className="card-title">{intl.formatMessage({ id: 'FORMS.STATS.CHART.ACTIVITY' })}</h5>
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
                        <h5 className="card-title">{intl.formatMessage({ id: 'FORMS.STATS.CHART.HEATMAP' })}</h5>
                    </Card.Header>
                    <Card.Body>
                        {(data.heatmap ?? []).length > 0 ? (
                            <ReactApexChart options={heatmapOptions} series={heatmapSeries} type="heatmap" height={360} />
                        ) : (
                            <div className="text-center text-muted p-4" style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {intl.formatMessage({ id: 'FORMS.STATS.EMPTY.HEATMAP' })}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div >

            <div className="col-md-5">
                <Card>
                    <Card.Header>
                        <h5 className="card-title">{intl.formatMessage({ id: 'FORMS.STATS.CHART.WORDCLOUD' })}</h5>
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
                                {intl.formatMessage({ id: 'FORMS.STATS.EMPTY.WORDCLOUD' })}
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div >
        </div >
    );
};

const QuestionsTab = (
    { fieldData, loading, error, defaultLocale }:
        { fieldData: any[], loading: boolean, error: string | null, defaultLocale: string }
) => {
    const intl = useIntl();
    if (loading) return <Spinner animation="border" size="sm" />;
    if (error) return <Alert variant="danger">{error}</Alert>;

    const countResponses = (field: any) => {
        if (field.distribution?.choices) {
            return field.distribution.choices.reduce((acc: number, choice: any) => acc + choice.count, 0);
        }
        return field.metrics?.total || 0;
    }

    return (
        <Card>
            <Card.Header>
                <h5 className="card-title">{intl.formatMessage({ id: 'FORMS.STATS.TAB.QUESTIONS' })}</h5>
            </Card.Header>
            <Table striped responsive>
                <thead>
                    <tr>
                        <th>{intl.formatMessage({ id: 'FORMS.STATS.TABLE.QUESTION_TITLE' })}</th>
                        <th>{intl.formatMessage({ id: 'FORMS.STATS.TABLE.QUESTION_TYPE' })}</th>
                        <th className="text-end">{intl.formatMessage({ id: 'FORMS.STATS.TABLE.RESPONSES_COUNT' })}</th>
                    </tr>
                </thead>
                <tbody>
                    {fieldData.map(field => (
                        <tr key={field.fieldId}>
                            <td>{getLabel(field.label, defaultLocale)}</td>
                            <td>
                                <span className="badge badge-light">{intl.formatMessage({ id: FIELD_TYPE_TRANSLATIONS[field.type] || field.type })}</span>
                            </td>
                            <td className="text-end fw-bold">{countResponses(field)}</td>
                        </tr>
                    ))}
                    {fieldData.length === 0 && (
                        <tr>
                            <td colSpan={3} className="text-center text-muted p-4">
                                {intl.formatMessage({ id: 'FORMS.STATS.EMPTY.QUESTIONS' })}
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
        { fieldData: any[], loading: boolean, error: string | null, defaultLocale: string }
) => {
    const intl = useIntl();

    if (loading) return <Spinner animation="border" size="sm" />;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!fieldData || fieldData.length === 0) return <Alert variant="info">{intl.formatMessage({ id: 'FORMS.STATS.EMPTY.QUESTIONS' })}</Alert>;

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
        xaxis: { categories: labels, title: { text: intl.formatMessage({ id: 'FORMS.STATS.CHART.COUNT' }) } },
        yaxis: { labels: { maxWidth: 200 } },
        legend: { show: false },
        title: { text: title },
    });

    return (
        <div className="d-flex flex-column gap-6">
            {fieldData.map(q => {
                const cardTitle = getLabel(q.label, defaultLocale);
                const hasDistribution = q.distribution && q.distribution.choices.length > 0;
                const typeLabel = intl.formatMessage({ id: FIELD_TYPE_TRANSLATIONS[q.type] || q.type });

                if (['single_choice', 'multi_choice', 'select', 'radio', 'checkbox'].includes(q.type)) {
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
                                    <ReactApexChart
                                        options={barOptions(intl.formatMessage({ id: 'FORMS.STATS.CHART.DISTRIBUTION' }), labels)}
                                        series={[{ name: intl.formatMessage({ id: 'FORMS.STATS.CHART.REPLIES' }), data }]}
                                        type="bar"
                                        height={Math.max(320, labels.length * 35)}
                                    />
                                ) : (
                                    <div className="text-muted text-center p-4">{intl.formatMessage({ id: 'FORMS.STATS.EMPTY.FIELD_RESPONSES' })}</div>
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
                            <p className="text-muted">Detailed analysis not available for this field type yet.</p>
                        </Card.Body>
                    </Card>
                );
            })}
        </div>
    );
};

const SubmissionsTab = ({ submissions, fieldData, onViewImage }: { submissions: any[], fieldData: any[], onViewImage: (url: string) => void }) => {
    const renderCellValue = (val: any) => {
        if (!val) return '-';

        // Handle Arrays (Multi-select or multiple files)
        if (Array.isArray(val)) {
            return (
                <div className="d-flex flex-column gap-1">
                    {val.map((item, idx) => (
                        <span key={idx}>{renderCellValue(item)}</span>
                    ))}
                </div>
            );
        }

        // Handle Objects (Attachments or Translations)
        if (typeof val === 'object') {
            // Check if it's a file attachment (has url/path and name/originalName/storagePath)
            if (val.url || val.path || val.storagePath) {
                const url = val.url || val.path;
                const name = val.name || val.originalName || (val.storagePath ? val.storagePath.split('/').pop() : 'Attachment');
                const isImage = (val.mimeType && val.mimeType.startsWith('image/')) ||
                    (name && /\.(jpg|jpeg|png|gif|webp)$/i.test(name));

                if (isImage && url) {
                    return (
                        <div className="d-flex align-items-center gap-2">
                            <img
                                src={url}
                                alt={name}
                                className="rounded border"
                                style={{ width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => onViewImage(url)}
                            />
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted small text-decoration-none">
                                <i className="bi bi-download"></i>
                            </a>
                        </div>
                    );
                }

                if (url) {
                    return (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-underline">
                            <i className="bi bi-paperclip me-1"></i>
                            {name}
                        </a>
                    );
                }

                // Fallback if URL is missing but we have storagePath (Backend signing failed?)
                if (val.storagePath) {
                    return <span className="text-danger small" title={val.storagePath}>File Error (No URL)</span>;
                }
            }
            // Check if it's a translation
            if (val['pt-BR'] || val['en-US']) {
                return getLabel(val);
            }
            return JSON.stringify(val);
        }

        return String(val);
    };

    const fieldMap = new Map<string, string>();
    fieldData.forEach(f => fieldMap.set(f.fieldId, getLabel(f.label)));

    const allKeys = new Set<string>();
    submissions.forEach(sub => {
        if (sub.data) Object.keys(sub.data).forEach(k => allKeys.add(k));
    });

    return (
        <Card>
            <Card.Body className="p-0">
                <div className="table-responsive">
                    <Table className="table align-middle table-row-dashed fs-6 gy-5 m-0">
                        <thead>
                            <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                <th className="ps-4">User</th>
                                <th>Date</th>
                                {Array.from(allKeys).map(key => (
                                    <th key={key}>{fieldMap.get(key) || key}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 fw-semibold">
                            {submissions.map(sub => (
                                <tr key={sub.id}>
                                    <td className="ps-4">{sub.userName}</td>
                                    <td>{new Date(sub.completedAt).toLocaleString()}</td>
                                    {Array.from(allKeys).map(key => (
                                        <td key={key}>{renderCellValue(sub.data?.[key])}</td>
                                    ))}
                                </tr>
                            ))}
                            {submissions.length === 0 && (
                                <tr>
                                    <td colSpan={allKeys.size + 2} className="text-center text-muted p-4">
                                        No submissions found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </Card.Body>
        </Card>
    );
}
