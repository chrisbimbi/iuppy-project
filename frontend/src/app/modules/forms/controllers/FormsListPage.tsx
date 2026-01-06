// src/app/modules/forms/controllers/FormsListPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormsApi, TranslatableString } from '../services/api';
import { api } from 'src/app/api';
import { Spinner, Button, Alert } from 'react-bootstrap';
import { useIntl } from 'react-intl';

import { Dropdown } from 'react-bootstrap';
import { useAuth } from '../../auth/core/Auth';

const Kebab: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Dropdown>
    <Dropdown.Toggle variant="light" size="sm" className="btn-active-light-primary no-caret">
      <i className="bi bi-three-dots-vertical"></i>
    </Dropdown.Toggle>
    <Dropdown.Menu align="end">{children}</Dropdown.Menu>
  </Dropdown>
);

export default function FormsListPage() {
  const nav = useNavigate();
  const intl = useIntl();
  const { currentUser } = useAuth();

  // 🔥 FIX: Prioritize localStorage (Context Switcher) over User Token
  const getEffectiveCompanyId = () => {
    if (typeof window !== 'undefined') {
      const fromLs = window.localStorage.getItem('companyId');
      if (fromLs) return fromLs;
    }
    return currentUser?.companyId;
  };
  const companyId = getEffectiveCompanyId();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [aggLoading, setAggLoading] = useState(false);
  const [aggErr, setAggErr] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, boolean>>({});

  const selectedIds = useMemo(() => Object.keys(sel).filter((k) => sel[k]), [sel]);

  const load = async (cId: string) => {
    setLoading(true);
    setErr(null);
    try {
      const data = await FormsApi.list({ companyId: cId, visibility: 'all' });
      setRows(data as any[]);
    } catch (e: any) {
      setErr(e.message || intl.formatMessage({ id: 'FORMS.LIST.ERROR.LOAD_FAILED' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) load(companyId);
  }, [companyId]);

  const getTitle = (title: TranslatableString, id: string) => {
    return title?.[intl.locale] || title?.['pt-BR'] || title?.['en'] || id;
  };

  const toLocalDateInput = (date: Date) => date.toISOString().split('T')[0];

  const bulkDuplicate = async () => {
    if (!companyId) return;
    if (!confirm(intl.formatMessage({ id: 'FORMS.LIST.CONFIRM.DUPLICATE' }))) return;
    try {
      await Promise.all(selectedIds.map(id => FormsApi.duplicate(id)));
      await load(companyId);
      setSel({});
    } catch (e) {
      alert(intl.formatMessage({ id: 'FORMS.LIST.ERROR.DUPLICATE_FAILED' }));
    }
  };

  const bulkDelete = async () => {
    if (!companyId) return;
    if (!confirm(intl.formatMessage({ id: 'FORMS.LIST.CONFIRM.DELETE' }))) return;
    try {
      await FormsApi.removeMany(selectedIds);
      await load(companyId);
      setSel({});
    } catch (e) {
      alert(intl.formatMessage({ id: 'FORMS.LIST.ERROR.DELETE_FAILED' }));
    }
  };

  const bulkPublish = async () => {
    if (!companyId) return;
    try {
      await Promise.all(selectedIds.map(id => FormsApi.publish(id)));
      await load(companyId);
      setSel({});
    } catch (e) {
      alert(intl.formatMessage({ id: 'FORMS.LIST.ERROR.PUBLISH_FAILED' }));
    }
  };

  const bulkUnpublish = async () => {
    if (!companyId) return;
    try {
      await Promise.all(selectedIds.map(id => FormsApi.unpublish(id)));
      await load(companyId);
      setSel({});
    } catch (e) {
      alert(intl.formatMessage({ id: 'FORMS.LIST.ERROR.UNPUBLISH_FAILED' }));
    }
  };

  const allDraft = rows.filter(r => selectedIds.includes(r.id || r.formId)).every(r => r.status === 'draft');
  const allPublished = rows.filter(r => selectedIds.includes(r.id || r.formId)).every(r => r.status === 'published');
  const handleRunAggregation = async () => {
    if (!companyId) return;
    setAggLoading(true);
    setAggErr(null);
    try {
      const todayStr = toLocalDateInput(new Date());
      await FormsApi.analyticsRunAggregation(todayStr);
      await load(companyId);
    } catch (e: any) {
      setAggErr(intl.formatMessage({ id: 'FORMS.LIST.ERROR.UPDATE_FAILED' }) + (e as any).message);
    } finally {
      setAggLoading(false);
    }
  };

  // ... bulk actions

  const content = useMemo(() => {
    if (loading)
      return (
        <div className="p-6 d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" /> {intl.formatMessage({ id: 'FORMS.LIST.LOADING' })}
        </div>
      );
    if (err) return <div className="alert alert-danger m-6">{err}</div>;

    if (!rows.length && !loading) {
      return <div className="p-6">{intl.formatMessage({ id: 'FORMS.LIST.EMPTY' })}</div>;
    }

    return (

      <div className="table-responsive p-6" data-testid="forms-list">
        <table className="table table-row-dashed align-middle">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedIds.length === rows.length}
                  onChange={(e) => {
                    const all: Record<string, boolean> = {};
                    if (e.target.checked) rows.forEach((r) => (all[r.id || r.formId] = true));
                    setSel(all);
                  }}
                />
              </th>
              <th>{intl.formatMessage({ id: 'FORMS.LIST.HEADER.TITLE' })}</th>
              <th>{intl.formatMessage({ id: 'FORMS.LIST.HEADER.STATUS' })}</th>
              <th>{intl.formatMessage({ id: 'FORMS.LIST.HEADER.SUBMISSIONS' })}</th>
              <th>{intl.formatMessage({ id: 'FORMS.LIST.HEADER.ON_TIME' })}</th>
              <th>{intl.formatMessage({ id: 'FORMS.LIST.HEADER.PUSH_SENT' })}</th>
              <th className="text-end">{intl.formatMessage({ id: 'FORMS.LIST.HEADER.ACTIONS' })}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const id = r.id || r.formId;
              const titleStr = getTitle(r.title, id);

              return (
                <tr key={id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!sel[id]}
                      onChange={(e) =>
                        setSel((s) => ({ ...s, [id]: e.target.checked }))
                      }
                    />
                  </td>
                  <td>{titleStr}</td>
                  <td>
                    <span className="badge badge-light-primary">{r.status}</span>
                  </td>
                  <td>{r.submissionsCount || r.submissions || 0}</td>
                  <td>{r.onTimeRate ? `${(r.onTimeRate * 100).toFixed(0)}%` : '-'}</td>
                  <td>{r.pushSent !== undefined ? r.pushSent : '-'}</td>
                  <td className="text-end">
                    <Kebab>
                      <Dropdown.Item
                        as="button"
                        onClick={() => nav(`/forms/${id}/submissions`)}
                      >
                        {intl.formatMessage({ id: 'FORMS.LIST.ACTION.VIEW_SUBMISSIONS' })}
                      </Dropdown.Item>
                      <Dropdown.Item
                        as="button"
                        onClick={() => nav(`/forms/${id}/stats`)}
                      >
                        {intl.formatMessage({ id: 'FORMS.LIST.ACTION.STATS' })}
                      </Dropdown.Item>
                      <div className="dropdown-divider"></div>
                      <Dropdown.Item
                        as="button"
                        onClick={() => nav(`/forms/${id}/edit`)}
                      >
                        {intl.formatMessage({ id: 'FORMS.LIST.ACTION.EDIT' })}
                      </Dropdown.Item>
                      <Dropdown.Item
                        as="button"
                        onClick={() =>
                          FormsApi.duplicate(id).then(() => {
                            if (companyId) return load(companyId);
                          })
                        }
                      >
                        {intl.formatMessage({ id: 'FORMS.LIST.ACTION.DUPLICATE' })}
                      </Dropdown.Item>
                      <div className="dropdown-divider"></div>
                      <Dropdown.Item
                        as="button"
                        className="text-danger"
                        onClick={() =>
                          FormsApi.removeMany([id]).then(() => {
                            if (companyId) return load(companyId);
                          })
                        }
                      >
                        {intl.formatMessage({ id: 'FORMS.LIST.ACTION.DELETE' })}
                      </Dropdown.Item>
                    </Kebab>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, [rows, loading, err, sel, selectedIds, nav, companyId, intl]);

  return (
    <div className="container-xxl">
      <div className="card">
        <div className="card-header align-items-center gap-3 flex-wrap">
          <h3 className="card-title">{intl.formatMessage({ id: 'FORMS.LIST.TITLE' })}</h3>
          <div className="card-toolbar d-flex gap-2">
            <Button
              variant="light"
              onClick={handleRunAggregation}
              disabled={aggLoading || loading}
              title="Atualizar dados de hoje"
            >
              {aggLoading ? <Spinner animation="border" size="sm" /> : intl.formatMessage({ id: 'FORMS.LIST.BUTTON.UPDATE_NOW' })}
            </Button>

            <Button variant="info" onClick={() => nav('/forms/dashboard')}>
              <i className="bi bi-bar-chart-fill me-1"></i> {intl.formatMessage({ id: 'FORMS.LIST.BUTTON.DASHBOARD' })}
            </Button>

            <button className="btn btn-primary" onClick={() => nav('/forms/new')}>
              {intl.formatMessage({ id: 'FORMS.LIST.BUTTON.CREATE' })}
            </button>
            {selectedIds.length > 0 && (
              <>
                <button className="btn btn-light" onClick={bulkDuplicate}>
                  {intl.formatMessage({ id: 'FORMS.LIST.ACTION.DUPLICATE' })}
                </button>
                {allDraft && (
                  <button className="btn btn-light" onClick={bulkPublish}>
                    {intl.formatMessage({ id: 'FORMS.LIST.BUTTON.PUBLISH' })}
                  </button>
                )}
                {allPublished && (
                  <button className="btn btn-light" onClick={bulkUnpublish}>
                    {intl.formatMessage({ id: 'FORMS.LIST.BUTTON.UNPUBLISH' })}
                  </button>
                )}
                <button className="btn btn-danger" onClick={bulkDelete}>
                  {intl.formatMessage({ id: 'FORMS.LIST.ACTION.DELETE' })}
                </button>
              </>
            )}
          </div>
        </div>

        {!loading && !err && (
          <div className="px-6 pt-6">
            <Alert variant="info" className="d-flex justify-content-between align-items-center mb-0">
              <div>
                {intl.formatMessage({ id: 'FORMS.LIST.INFO.STATS_AGGREGATION' })}
                {aggErr && <div className="text-danger small mt-1">{aggErr}</div>}
              </div>
            </Alert>
          </div>
        )}

        {content}
      </div>
    </div>
  );
}