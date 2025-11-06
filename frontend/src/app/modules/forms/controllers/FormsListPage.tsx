import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormsApi } from '../services/api'

type Row = {
  id: string
  title: string
  status: 'draft'|'published'|'expired'|'archived'
  deadlineAt?: string | null
  createdAt?: string
  questionsCount?: number
  submissionsCount?: number
}

function Kebab({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="dropdown">
      <button className="btn btn-sm btn-light btn-icon" onClick={()=>setOpen(o=>!o)}>
        <i className="bi bi-three-dots-vertical" />
      </button>
      {open && (
        <div className="dropdown-menu show" style={{ position:'absolute' }} onMouseLeave={()=>setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  )
}

export default function FormsListPage() {
  const nav = useNavigate()
  const [rows, setRows] = useState<Row[]>([])
  const [sel, setSel] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setErr(null)
    try {
      const list = await FormsApi.list()
      const normalized: Row[] = list.map((f:any)=>({
        id: f.id, title: f.title, status: f.status,
        deadlineAt: f.deadlineAt ?? null, createdAt: f.createdAt,
        questionsCount: Number(f.questionsCount || 0),
        submissionsCount: Number(f.submissionsCount || 0),
      }))
      setRows(normalized)
    } catch (e:any) { setErr(String(e?.message || e)) }
    finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const selectedIds = useMemo(()=>Object.keys(sel).filter(id=>sel[id]), [sel])
  const allDraft = selectedIds.length>0 && selectedIds.every(id => rows.find(r=>r.id===id)?.status === 'draft')
  const allPublished = selectedIds.length>0 && selectedIds.every(id => rows.find(r=>r.id===id)?.status === 'published')

  const bulkDelete = async () => { if (!selectedIds.length) return; await FormsApi.deleteMany(selectedIds); setSel({}); await load() }
  const bulkDuplicate = async () => { for (const id of selectedIds) await FormsApi.duplicate(id); setSel({}); await load() }
  const bulkPublish = async () => { for (const id of selectedIds) await FormsApi.publish(id); setSel({}); await load() }
  const bulkUnpublish = async () => { for (const id of selectedIds) await FormsApi.unpublish(id); setSel({}); await load() }

  const content = useMemo(() => {
    if (loading)  return <div className="p-6">Carregando...</div>
    if (err)      return <div className="alert alert-danger m-6">{err}</div>
    if (!rows.length) return <div className="p-6">Nenhum formulário ainda.</div>
    return (
      <div className="table-responsive p-6" data-testid="forms-list">
        <table className="table table-row-dashed align-middle">
          <thead>
            <tr>
              <th style={{width:36}}><input type="checkbox"
                checked={rows.length>0 && selectedIds.length===rows.length}
                onChange={e=>{
                  const all: Record<string,boolean> = {}
                  if (e.target.checked) rows.forEach(r=>all[r.id]=true)
                  setSel(all)
                }}/></th>
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
                <td><input type="checkbox" checked={!!sel[r.id]} onChange={e=>setSel(s=>({...s, [r.id]: e.target.checked }))}/></td>
                <td>{r.title}</td>
                <td><span className="badge badge-light-primary">{r.status}</span></td>
                <td>{r.questionsCount ?? '-'}</td>
                <td>{r.submissionsCount ?? '-'}</td>
                <td>{r.deadlineAt ? new Date(r.deadlineAt).toLocaleString() : '-'}</td>
                <td className="text-end">
                  <Kebab>
                    {r.status==='draft' && (
                      <button className="dropdown-item" onClick={()=>FormsApi.publish(r.id).then(load)}>Publicar</button>
                    )}
                    {r.status==='published' && (
                      <button className="dropdown-item" onClick={()=>FormsApi.unpublish(r.id).then(load)}>Despublicar</button>
                    )}
                    <button className="dropdown-item" onClick={()=>nav(`/forms/${r.id}/edit`)}>Editar</button>
                    <button className="dropdown-item" onClick={()=>FormsApi.duplicate(r.id).then(load)}>Duplicar</button>
                    <button className="dropdown-item text-danger" onClick={()=>FormsApi.deleteMany([r.id]).then(load)}>Apagar</button>
                  </Kebab>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }, [rows, loading, err, sel, selectedIds.length, nav])

  return (
    <div className="card">
      <div className="card-header align-items-center gap-3 flex-wrap">
        <h3 className="card-title">Formulários</h3>
        <div className="card-toolbar d-flex gap-2">
          <button className="btn btn-primary" onClick={() => nav('/forms/new')}>+ Criar formulário</button>
          {selectedIds.length>0 && (
            <>
              <button className="btn btn-light" onClick={bulkDuplicate}>Duplicar</button>
              {allDraft && <button className="btn btn-light" onClick={bulkPublish}>Publicar</button>}
              {allPublished && <button className="btn btn-light" onClick={bulkUnpublish}>Despublicar</button>}
              <button className="btn btn-danger" onClick={bulkDelete}>Apagar</button>
            </>
          )}
        </div>
      </div>
      {content}
    </div>
  )
}