// src/modules/forms/controllers/FormsListPage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormsApi } from '../services/api';
import { api } from 'src/app/api';

type Row = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'expired' | 'archived';
  deadlineAt?: string | null;
  createdAt?: string;
  questionsCount?: number;
  submissionsCount?: number;
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
          style={{ position: 'absolute', right: 0 }}
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

  // primeiro pega o companyId do usuário logado
  useEffect(() => {
    (async () => {
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
          // opcional: garantir que fica salvo
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('companyId', cid);
          }
        } else {
          setCompanyId(''); // marca como "não achei"
        }
      } catch (e: any) {
        setCompanyId(''); // não achei
      }
    })();
  }, []);

  const load = async (cid: string) => {
    setLoading(true);
    setErr(null);
    try {
      const list = await FormsApi.list({ companyId: cid });
      const normalized: Row[] = list.map((f: any) => ({
        id: f.id,
        title: f.title,
        status: f.status,
        deadlineAt: f.deadlineAt ?? null,
        createdAt: f.createdAt,
        questionsCount: Number(f.questionsCount || f.fieldCount || 0),
        submissionsCount: Number(f.submissionsCount || 0),
      }));
      setRows(normalized);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  // quando tiver o companyId, carrega
  useEffect(() => {
    if (companyId === null) return; // ainda carregando /auth/me
    if (!companyId) {
      // não achou companyId -> mostra erro
      setErr('companyId not found for this user');
      setLoading(false);
      return;
    }
    load(companyId);
  }, [companyId]);

  const selectedIds = useMemo(
    () => Object.keys(sel).filter((id) => sel[id]),
    [sel],
  );

  const allDraft =
    selectedIds.length > 0 &&
    selectedIds.every((id) => rows.find((r) => r.id === id)?.status === 'draft');
  const allPublished =
    selectedIds.length > 0 &&
    selectedIds.every((id) => rows.find((r) => r.id === id)?.status === 'published');

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

  const content = useMemo(() => {
    if (loading) return <div className="p-6">Carregando...</div>;
    if (err) return <div className="alert alert-danger m-6">{err}</div>;
    if (!rows.length) return <div className="p-6">Nenhum formulário ainda.</div>;
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
                    if (e.target.checked) rows.forEach((r) => (all[r.id] = true));
                    setSel(all);
                  }}
                />
              </th>
              <th>Título</th>
              <th>Status</th>
              <th># Perguntas</th>
              <th># Respostas</th>
              <th>Deadline</th>
              <th className="text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={!!sel[r.id]}
                    onChange={(e) =>
                      setSel((s) => ({ ...s, [r.id]: e.target.checked }))
                    }
                  />
                </td>
                <td>{r.title}</td>
                <td>
                  <span className="badge badge-light-primary">{r.status}</span>
                </td>
                <td>{r.questionsCount ?? '-'}</td>
                <td>{r.submissionsCount ?? '-'}</td>
                <td>{r.deadlineAt ? new Date(r.deadlineAt).toLocaleString() : '-'}</td>
                <td className="text-end">
                  <Kebab>
                    <button
                      className="dropdown-item"
                      onClick={() => nav(`/forms/${r.id}/submissions`)}
                    >
                      Ver envios
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => nav(`/forms/${r.id}/edit`)}
                    >
                      Editar
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() =>
                        FormsApi.duplicate(r.id).then(() => {
                          if (companyId) {
                            return load(companyId)
                          }
                        })
                      }
                    >
                      Duplicar
                    </button>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() =>
                        FormsApi.removeMany([r.id]).then(() => {
                          if (companyId) {
                            return load(companyId)
                          }
                        })
                      }
                    >
                      Apagar
                    </button>
                  </Kebab>
                </td>
              </tr>
            ))}
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
      {content}
    </div>
  );
}
