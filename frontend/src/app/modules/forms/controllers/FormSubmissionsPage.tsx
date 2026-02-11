// src/app/modules/forms/controllers/FormSubmissionsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FormsApi, TranslatableString } from '../services/api';
import { Card, Spinner, Alert, Button, Table } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { SubmissionDetailModal } from '../components/SubmissionDetailModal';

import { useAuth } from '../../auth/core/Auth';

type FormInfo = {
  id: string;
  title: TranslatableString | string;
  defaultLocale: string;
  requiresApproval: boolean;
  fields: Array<{
    id: string;
    label: TranslatableString | string;
    type: string;
    order: number;
  }>;
};

type Submission = {
  submissionId: string;
  submittedAt: string;
  status: string;
  isOnTime: boolean;
  external: boolean;
  externalEmail?: string;
  fileCount: number;
  userId?: string;
  userName?: string;
  answers: Array<{
    fieldId: string;
    value: any;
    type: string;
  }>;
};

const getTranslation = (
  field: TranslatableString | string | null | undefined,
  locale: string,
) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field[locale] || field['pt-BR'] || field[Object.keys(field)[0]] || '';
};

export default function FormSubmissionsPage() {
  const intl = useIntl();
  const { formId } = useParams<{ formId: string }>();
  const { currentUser } = useAuth();
  const companyId = currentUser?.companyId || window.localStorage.getItem('companyId') || undefined;

  const [form, setForm] = useState<FormInfo | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [detailModalShow, setDetailModalShow] = useState(false);
  const [currentSubId, setCurrentSubId] = useState<string | null>(null);

  const loadData = () => {
    if (!formId) return;
    setLoading(true);
    setErr(null);

    Promise.all([
      FormsApi.get(formId, companyId),
      FormsApi.analyticsSubmissions(formId, {
        pageSize: '100',
        companyId,
      }),
    ])
      .then(([formDetail, subResponse]) => {
        setForm(formDetail as FormInfo);
        setSubmissions(subResponse.items as Submission[]);
      })
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, [formId]);

  const openDetailModal = (submissionId: string) => {
    setCurrentSubId(submissionId);
    setDetailModalShow(true);
  };

  // 🔥 CORREÇÃO: Chamada REAL da API
  const handleLegacyResponse = async (
    type: 'reply' | 'approve' | 'reject',
    message: string
  ) => {
    if (!formId || !currentSubId) return;

    try {
      // Chama a API real (mensagem é opcional no DTO, mas passamos string vazia se null)
      await FormsApi.respond(formId, currentSubId, { type, message: message || '' });

      setDetailModalShow(false);
      setCurrentSubId(null);
      loadData();
    } catch (e: any) {
      console.error('Falha ao responder', e);
      alert('Erro ao processar ação: ' + (e.message || e));
    }
  };

  const tableColumns = useMemo(() => {
    if (!form) return [];
    const locale = form.defaultLocale || 'pt-BR';

    const columns = [
      { id: 'user', label: intl.formatMessage({ id: 'FORMS.SUBMISSIONS.TABLE.USER' }) },
      { id: 'submittedAt', label: intl.formatMessage({ id: 'FORMS.SUBMISSIONS.TABLE.DATE' }) },
      { id: 'status', label: intl.formatMessage({ id: 'FORMS.SUBMISSIONS.TABLE.STATUS' }) },
    ];

    const fieldColumns = (form.fields || [])
      .sort((a, b) => a.order - b.order)
      .map(f => ({
        id: f.id,
        label: getTranslation(f.label, locale),
      }));

    return [...columns, ...fieldColumns];
  }, [form]);

  const getAnswerForField = (sub: Submission, fieldId: string) => {
    const answer = sub.answers?.find(a => a.fieldId === fieldId);
    if (!answer) return 'N/A';
    if (Array.isArray(answer.value)) return answer.value.join(', ');
    if (typeof answer.value === 'object' && answer.value !== null) return JSON.stringify(answer.value);
    return String(answer.value);
  };

  if (loading && !form) {
    return <Card><Card.Body><Spinner animation="border" size="sm" /> {intl.formatMessage({ id: 'FORMS.SUBMISSIONS.LOADING' })}</Card.Body></Card>;
  }

  if (err) return <Alert variant="danger">{err}</Alert>;
  if (!form) return <Alert variant="warning">{intl.formatMessage({ id: 'FORMS.SUBMISSIONS.ERROR.NOT_FOUND' })}</Alert>;

  const formTitle = getTranslation(form.title, form.defaultLocale);

  return (
    <div className="container-xxl">
      <div className="app-page" id="kt_app_page">

        <Card>
          <Card.Header>
            <h3 className="card-title">{intl.formatMessage({ id: 'FORMS.SUBMISSIONS.TITLE' }, { formTitle })}</h3>
            <div className="card-toolbar">
              <Link to={`/forms/${formId}/stats`} className="btn btn-sm btn-light me-2">{intl.formatMessage({ id: 'FORMS.SUBMISSIONS.BUTTON.STATS' })}</Link>
              <Link to="/forms" className="btn btn-sm btn-light-primary">{intl.formatMessage({ id: 'FORMS.SUBMISSIONS.BUTTON.BACK' })}</Link>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="card-body py-3">
              <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5">
                  <thead>
                    <tr>
                      {tableColumns.map(col => <th key={col.id}>{col.label}</th>)}
                      <th className="text-end">{intl.formatMessage({ id: 'FORMS.SUBMISSIONS.TABLE.ACTIONS' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map(sub => (
                      <tr key={sub.submissionId}>
                        <td>{sub.userName || sub.userId || (sub.external ? sub.externalEmail : intl.formatMessage({ id: 'FORMS.SUBMISSIONS.STATUS.ANONYMOUS' }))}</td>
                        <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                        <td><span className={`badge badge-light-${sub.status === 'approved' ? 'success' : sub.status === 'rejected' ? 'danger' : 'warning'}`}>{sub.status}</span></td>
                        {(form.fields || []).sort((a, b) => a.order - b.order).map(f => (
                          <td key={f.id}>{getAnswerForField(sub, f.id)}</td>
                        ))}
                        <td className="text-end">
                          <Button variant="primary" size="sm" onClick={() => openDetailModal(sub.submissionId)}>{intl.formatMessage({ id: 'FORMS.SUBMISSIONS.BUTTON.VIEW' })}</Button>
                        </td>
                      </tr>
                    ))}
                    {submissions.length === 0 && (
                      <tr><td colSpan={tableColumns.length + 1} className="text-center text-muted p-4">{intl.formatMessage({ id: 'FORMS.SUBMISSIONS.EMPTY' })}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card.Body>
        </Card>

        {currentSubId && formId && (
          <SubmissionDetailModal
            show={detailModalShow}
            onHide={() => setDetailModalShow(false)}
            form={form}
            submissionId={currentSubId}
            onRespond={handleLegacyResponse}
          />
        )}
      </div>
    </div>
  );
}