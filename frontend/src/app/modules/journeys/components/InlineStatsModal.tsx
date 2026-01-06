import React, { useEffect, useState } from 'react';
import { Modal, Button, Nav, Table } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { getStepAnalytics, getStepSubmissions } from '../services/journeys.service';

interface InlineStatsModalProps {
    show: boolean;
    onHide: () => void;
    journeyId: string;
    stepId: string;
    stepTitle: string;
}

export const InlineStatsModal: React.FC<InlineStatsModalProps> = ({ show, onHide, journeyId, stepId, stepTitle }) => {
    const [activeTab, setActiveTab] = useState<'stats' | 'submissions'>('stats');
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState<any>(null);
    const [submissionsData, setSubmissionsData] = useState<any[]>([]);

    useEffect(() => {
        if (show && journeyId && stepId) {
            setLoading(true);

            // Fetch both stats and submissions
            Promise.all([
                getStepAnalytics(journeyId, stepId),
                getStepSubmissions(journeyId, stepId)
            ])
                .then(([stats, submissions]) => {
                    setStatsData(stats);
                    setSubmissionsData(submissions);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [show, journeyId, stepId]);

    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const getLabel = (label: any) => {
        if (!label) return '';
        if (typeof label === 'string') return label;
        if (typeof label === 'object') {
            return label['pt-BR'] || label['en-US'] || Object.values(label)[0] || JSON.stringify(label);
        }
        return String(label);
    };

    const intl = useIntl(); // Make sure to import useIntl inside component

    const renderStats = () => {
        if (!statsData) return <div className="text-center py-5 text-muted">{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.NO_STATS', defaultMessage: 'No stats available' })}</div>;

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.TOTAL_SUBMISSIONS', defaultMessage: 'Total Submissions' })}</h4>
                    <span className="badge bg-primary fs-5">{statsData.totalSubmissions}</span>
                </div>

                {statsData.questions.map((q: any) => (
                    <div key={q.id} className="card bg-light mb-4">
                        <div className="card-body">
                            <h5 className="card-title fw-bold mb-3">{getLabel(q.label)}</h5>

                            {/* Choice Answers (Polls, Selects) */}
                            {q.answers && q.answers.length > 0 && (
                                <div className="d-flex flex-column gap-3">
                                    {q.answers.map((ans: any, idx: number) => (
                                        <div key={idx}>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="fw-semibold">{getLabel(ans.label)}</span>
                                                <span className="text-muted small">{ans.count} votes ({ans.percentage}%)</span>
                                            </div>
                                            <div className="progress h-6px">
                                                <div
                                                    className="progress-bar bg-success"
                                                    role="progressbar"
                                                    style={{ width: `${ans.percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Text Answers */}
                            {q.textAnswers && q.textAnswers.length > 0 && (
                                <div className="mt-2">
                                    <h6 className="text-muted text-uppercase fs-8 fw-bold mb-2">{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.LATEST_ANSWERS', defaultMessage: 'Latest Answers' })}</h6>
                                    <ul className="list-group list-group-flush bg-transparent">
                                        {q.textAnswers.map((txt: string, idx: number) => (
                                            <li key={idx} className="list-group-item bg-transparent px-0 py-2 border-bottom border-gray-300">
                                                {txt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(!q.answers?.length && !q.textAnswers?.length) && (
                                <div className="text-muted fst-italic">{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.NO_ANSWERS', defaultMessage: 'No answers yet.' })}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

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
            // Backend adds 'url' if signed correctly.
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
                                onClick={() => setPreviewImage(url)}
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

    const renderSubmissions = () => {
        if (!submissionsData || submissionsData.length === 0) {
            return <div className="text-center py-5 text-muted">{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.NO_SUBMISSIONS', defaultMessage: 'No submissions found' })}</div>;
        }

        // Collect all unique field keys from data to build table headers
        const fieldMap = new Map<string, string>();
        if (statsData?.questions) {
            statsData.questions.forEach((q: any) => fieldMap.set(q.id, getLabel(q.label)));
        }

        // Also scan submissions for any keys not in stats
        const allKeys = new Set<string>();
        submissionsData.forEach(sub => {
            if (sub.data) {
                Object.keys(sub.data).forEach(k => allKeys.add(k));
            }
        });

        return (
            <div className="table-responsive">
                <Table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                        <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                            <th>{intl.formatMessage({ id: 'JOURNEYS.STATS.LABEL.USERS', defaultMessage: 'User' })}</th>
                            <th>{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.USERS.TABLE.DATE', defaultMessage: 'Date' })}</th>
                            {Array.from(allKeys).map(key => (
                                <th key={key}>{fieldMap.get(key) || key}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 fw-semibold">
                        {submissionsData.map(sub => (
                            <tr key={sub.id}>
                                <td>{sub.userName}</td>
                                <td>{new Date(sub.completedAt).toLocaleString()}</td>
                                {Array.from(allKeys).map(key => (
                                    <td key={key}>{renderCellValue(sub.data?.[key])}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>
        );
    };

    return (
        <>
            <Modal show={show} onHide={onHide} size="xl">
                <Modal.Header closeButton>
                    <Modal.Title>{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.TITLE', defaultMessage: 'Statistics' })}: {stepTitle}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={(k) => setActiveTab(k as any)}>
                        <Nav.Item>
                            <Nav.Link eventKey="stats">{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.TAB.OVERVIEW', defaultMessage: 'Overview' })}</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="submissions">{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.TAB.SUBMISSIONS', defaultMessage: 'Submissions List' })}</Nav.Link>
                        </Nav.Item>
                    </Nav>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                        </div>
                    ) : (
                        activeTab === 'stats' ? renderStats() : renderSubmissions()
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.CLOSE', defaultMessage: 'Close' })}</Button>
                </Modal.Footer>
            </Modal>

            {/* Image Preview Modal */}
            <Modal show={!!previewImage} onHide={() => setPreviewImage(null)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.PREVIEW', defaultMessage: 'Image Preview' })}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0 bg-dark">
                    {previewImage && (
                        <img
                            src={previewImage}
                            alt="Preview"
                            style={{ maxWidth: '100%', maxHeight: '80vh' }}
                        />
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <a href={previewImage || '#'} target="_blank" download className="btn btn-primary">
                        {intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.DOWNLOAD', defaultMessage: 'Download' })}
                    </a>
                    <Button variant="secondary" onClick={() => setPreviewImage(null)}>{intl.formatMessage({ id: 'JOURNEYS.STATS.MODAL.CLOSE', defaultMessage: 'Close' })}</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};
