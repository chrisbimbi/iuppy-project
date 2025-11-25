// src/app/modules/forms/controllers/FormsListPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormsApi, TranslatableString } from '../services/api';
import { api } from 'src/app/api';
import { Spinner, Button, Alert } from 'react-bootstrap';

type Row = {
  formId: string;
  title: TranslatableString | string;
  status: 'draft' | 'published' | 'expired' | 'archived';
  submissions: number;
  onTime: number;
  onTimeRate: number;
  pushSent: number;
};

const toLocalDateInput = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function Kebab({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="dropdown" style={{ position: 'relative' }}>
      <button
        className="btn btn-sm btn-light btn-icon"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <i className="bi bi-three-dots-vertical" />
      </button>
      {open && (
        <div
          className="dropdown-menu show"
          style={{ position: 'absolute', right: 0, zIndex: 100 }}
          onMouseLeave={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function FormsListPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  
  const [aggLoading, setAggLoading] = useState(false);
  const [aggErr, setAggErr] = useState<string | null>(null);

  useEffect(() => {
    ; (async () => {
      try {
        const meRes = await api.get('/auth/me');
        const data = meRes.data || {};
        const cid =
          data.companyId ||
          data.company?.id ||
          (typeof window !== 'undefined'
            ? window.localStorage.getItem('companyId')
            : null);
        if (cid) {
          setCompanyId(cid);
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('companyId', cid);
          }
        } else {
          setCompanyId('');
        }
      } catch (e: any) {
        setCompanyId('');
      }
    })();
  }, []);

  const load = async (cid: string) => {
    setLoading(true);
    setErr(null);
    setAggErr(null);
    try {
      const data = await FormsApi.analyticsList({});
      const items: Row[] = (data.items ?? []).map((f: any) => ({
        formId: f.formId,
        title: f.title,
        status: f.status,
        submissions: Number(f.submissions || 0),
        onTime: Number(f.onTime || 0),
        onTimeRate: Number(f.onTimeRate || 0),
        pushSent: Number(f.pushSent || 0),
      }));
      setRows(items);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId === null) return;
    if (!companyId) {
      setErr('companyId not found for this user');
      setLoading(false);
      return;
    }
    load(companyId);
  }, [companyId]);

  const handleRunAggregation = async () => {
    if (!companyId) return;
    setAggLoading(true);
    setAggErr(null);
    try {
      const todayStr = toLocalDateInput(new Date());
      await FormsApi.analyticsRunAggregation(todayStr);
      await load(companyId);
    } catch (e: any) {
      setAggErr('Falha ao atualizar dados: ' + (e as any).message);
    } finally {
      setAggLoading(false);
    }
  };

  const selectedIds = useMemo(
    () => Object.keys(sel).filter((id) => sel[id]),
    [sel],
  );

  const allDraft =
    selectedIds.length > 0 &&
    selectedIds.every((id) => rows.find((r) => r.formId === id)?.status === 'draft');
  const allPublished =
    selectedIds.length > 0 &&
    selectedIds.every(
      (id) => rows.find((r) => r.formId === id)?.status === 'published',
    );

  const bulkDelete = async () => {
    if (!selectedIds.length || !companyId) return;
    await FormsApi.removeMany(selectedIds);
    setSel({});
    await load(companyId);
  };

  const bulkDuplicate = async () => {
    if (!companyId) return;
    for (const id of selectedIds) {
      await FormsApi.duplicate(id);
    }
    setSel({});
    await load(companyId);
  };

  const bulkPublish = async () => {
    if (!companyId) return;
    for (const id of selectedIds) {
      await FormsApi.publish(id);
    }
    setSel({});
    await load(companyId);
  };

  const bulkUnpublish = async () => {
    if (!companyId) return;
    for (const id of selectedIds) {
      await FormsApi.unpublish(id);
    }
    setSel({});
    await load(companyId);
  };

  const getTitle = (title: TranslatableString | string, fallbackId: string) => {
    if (typeof title === 'string') return title;
    if (typeof title === 'object' && title !== null) {
      return title['pt-BR'] ?? title[Object.keys(title)[0]] ?? fallbackId;
    }
    return fallbackId;
  };

  const content = useMemo(() => {
    if (loading)
      return (
        <div className="p-6 d-flex align-items-center gap-2">
          <Spinner animation="border" size="sm" /> Carregando...
        </div>
      );
    if (err) return <div className="alert alert-danger m-6">{err}</div>;
    
    if (!rows.length && !loading) {
       return <div className="p-6">Nenhum formulário ainda.</div>;
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
                    if (e.target.checked) rows.forEach((r) => (all[r.formId] = true));
                    setSel(all);
                  }}
                />
              </th>
              <th>Título</th>
              <th>Status</th>
              <th>Envios</th>
              <th>No Prazo (%)</th>
              <th>Push Enviado</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const titleStr = getTitle(r.title, r.formId);

              return (
                <tr key={r.formId}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!sel[r.formId]}
                      onChange={(e) =>
                        setSel((s) => ({ ...s, [r.formId]: e.target.checked }))
                      }
                    />
                  </td>
                  <td>{titleStr}</td>
                  <td>
                    <span className="badge badge-light-primary">{r.status}</span>
                  </td>
                  <td>{r.submissions}</td>
                  <td>{`${(r.onTimeRate * 100).toFixed(0)}%`}</td>
                  <td>{r.pushSent > 0 ? r.pushSent : '-'}</td>
                  <td className="text-end">
                    <Kebab>
                      <button
                        className="dropdown-item"
                        onClick={() => nav(`/forms/${r.formId}/submissions`)}
                      >
                        Ver envios
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => nav(`/forms/${r.formId}/stats`)}
                      >
                        Estatísticas
                      </button>
                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item"
                        onClick={() => nav(`/forms/${r.formId}/edit`)}
                      >
                        Editar
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() =>
                          FormsApi.duplicate(r.formId).then(() => {
                            if (companyId) return load(companyId);
                          })
                        }
                      >
                        Duplicar
                      </button>
                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item text-danger"
                        onClick={() =>
                          FormsApi.removeMany([r.formId]).then(() => {
                            if (companyId) return load(companyId);
                          })
                        }
                      >
                        Apagar
                      </button>
                    </Kebab>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }, [rows, loading, err, sel, selectedIds, nav, companyId]);

  return (
    <div className="card">
      <div className="card-header align-items-center gap-3 flex-wrap">
        <h3 className="card-title">Formulários</h3>
        <div className="card-toolbar d-flex gap-2">
          <Button
            variant="light"
            onClick={handleRunAggregation}
            disabled={aggLoading || loading}
            title="Atualizar dados de hoje"
          >
            {aggLoading ? <Spinner animation="border" size="sm" /> : 'Atualizar Agora'}
          </Button>
          
          <Button variant="info" onClick={() => nav('/forms/dashboard')}>
             <i className="bi bi-bar-chart-fill me-1"></i> Dashboard Geral
          </Button>

          <button className="btn btn-primary" onClick={() => nav('/forms/new')}>
            + Criar formulário
          </button>
          {selectedIds.length > 0 && (
            <>
              <button className="btn btn-light" onClick={bulkDuplicate}>
                Duplicar
              </button>
              {allDraft && (
                <button className="btn btn-light" onClick={bulkPublish}>
                  Publicar
                </button>
              )}
              {allPublished && (
                <button className="btn btn-light" onClick={bulkUnpublish}>
                  Despublicar
                </button>
              )}
              <button className="btn btn-danger" onClick={bulkDelete}>
                Apagar
              </button>
            </>
          )}
        </div>
      </div>
      
      {!loading && !err && (
        <div className="px-6 pt-6">
          <Alert variant="info" className="d-flex justify-content-between align-items-center mb-0">
            <div>
              As estatísticas são agregadas diariamente (às 2:00). Para dados em tempo real, use o botão "Atualizar Agora".
              {aggErr && <div className="text-danger small mt-1">{aggErr}</div>}
            </div>
          </Alert>
        </div>
      )}

      {content}
    </div>
  );
}