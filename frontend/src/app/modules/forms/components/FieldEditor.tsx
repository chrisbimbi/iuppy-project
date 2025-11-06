import React from 'react'

export type Field = {
  id?: string
  type: 'short_text'|'long_text'|'number'|'date'|'multi_choice'|'single_choice'|'stars'|'scale'
  label: string
  required?: boolean
  options?: { id: string; label: string }[] | null
  order: number
}

type Props = {
  fields: Field[]
  onChange: (fields: Field[]) => void
}

type LocalField = Field & { _localId: string }

const genId = () => Math.random().toString(36).slice(2, 10)

function toLocal(list: Field[]): LocalField[] {
  return (list ?? [])
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((f) => ({ ...f, _localId: genId() }))
}

function fromLocal(list: LocalField[]): Field[] {
  return list.map(({ _localId, ...rest }, idx) => ({
    ...rest,
    order: idx,
  }))
}

const EMPTY_TEXT_FIELD: LocalField = {
  _localId: genId(),
  type: 'short_text',
  label: '',
  required: false,
  options: null,
  order: 0,
}

export default function FieldEditor({ fields, onChange }: Props) {
  const [items, setItems] = React.useState<LocalField[]>(() => toLocal(fields))
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // sincroniza quando vem do servidor
  React.useEffect(() => {
    setItems(toLocal(fields))
    setActiveId((prev) => {
      // preserva seleção se ainda existir
      return toLocal(fields).some((f) => f._localId === prev) ? prev : null
    })
  }, [fields])

  const commit = (next: LocalField[]) => {
    setItems(next)
    onChange(fromLocal(next))
  }

  const addField = (type: LocalField['type']) => {
    const nf: LocalField = {
      _localId: genId(),
      type,
      label: '',
      required: false,
      options: (type === 'multi_choice' || type === 'single_choice')
        ? [{ id: genId(), label: 'Opção 1' }, { id: genId(), label: 'Opção 2' }]
        : null,
      order: items.length,
    }
    const next = [...items, nf]
    commit(next)
    setActiveId(nf._localId)
  }

  const duplicate = (id: string) => {
    const idx = items.findIndex((f) => f._localId === id)
    if (idx < 0) return
    const src = items[idx]
    const clone: LocalField = {
      ...src,
      _localId: genId(),
      label: src.label ? `${src.label} (cópia)` : '',
      order: src.order + 0.1, // coloca logo após
      options: src.options ? src.options.map(o => ({ ...o, id: genId() })) : null,
    }
    const next = [...items.slice(0, idx + 1), clone, ...items.slice(idx + 1)]
    // reordena
    next.forEach((f, i) => (f.order = i))
    commit(next)
    setActiveId(clone._localId)
  }

  const remove = (id: string) => {
    const next = items.filter((f) => f._localId !== id)
    next.forEach((f, i) => (f.order = i))
    commit(next)
    setActiveId(null)
  }

  const move = (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((f) => f._localId === id)
    const j = idx + dir
    if (idx < 0 || j < 0 || j >= items.length) return
    const next = [...items]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    next.forEach((f, i) => (f.order = i))
    commit(next)
  }

  const patch = (id: string, patcher: (f: LocalField) => LocalField) => {
    const next = items.map((f) => (f._localId === id ? patcher({ ...f }) : f))
    commit(next)
  }

  const setOption = (fid: string, oid: string, label: string) => {
    patch(fid, (f) => {
      if (!f.options) f.options = []
      f.options = f.options!.map((o) => (o.id === oid ? { ...o, label } : o))
      return f
    })
  }
  const addOption = (fid: string) => {
    patch(fid, (f) => {
      if (!f.options) f.options = []
      f.options!.push({ id: genId(), label: `Opção ${f.options!.length + 1}` })
      return f
    })
  }
  const removeOption = (fid: string, oid: string) => {
    patch(fid, (f) => {
      f.options = (f.options ?? []).filter((o) => o.id !== oid)
      return f
    })
  }

  // evita “pular para o topo”/perda de foco: use keys estáveis (_localId)
  const renderItem = (f: LocalField, i: number) => {
    const isActive = activeId === f._localId
    return (
      <div key={f._localId} className={`border rounded p-3 mb-3 ${isActive ? 'border-primary' : ''}`}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <strong className="me-auto">Pergunta #{i + 1}</strong>
          <div className="btn-group">
            <button type="button" className="btn btn-sm btn-light" onClick={() => move(f._localId, -1)} disabled={i === 0}>↑</button>
            <button type="button" className="btn btn-sm btn-light" onClick={() => move(f._localId, 1)} disabled={i === items.length - 1}>↓</button>
          </div>
          <button type="button" className="btn btn-sm btn-light" onClick={() => duplicate(f._localId)}>Duplicar</button>
          <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(f._localId)}>Apagar</button>
        </div>

        <div className="row g-3 mt-2">
          <div className="col-md-6">
            <label className="form-label">Enunciado</label>
            <input
              className="form-control"
              value={f.label}
              onFocus={() => setActiveId(f._localId)}
              onChange={(e) => patch(f._localId, (ff) => ({ ...ff, label: e.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={f.type}
              onChange={(e) => {
                const t = e.target.value as LocalField['type']
                if (t === 'multi_choice' || t === 'single_choice') {
                  patch(f._localId, (ff) => ({
                    ...ff,
                    type: t,
                    options: ff.options && ff.options.length > 0
                      ? ff.options
                      : [{ id: genId(), label: 'Opção 1' }, { id: genId(), label: 'Opção 2' }],
                  }))
                } else {
                  patch(f._localId, (ff) => ({ ...ff, type: t, options: null }))
                }
              }}
            >
              <option value="short_text">Texto curto</option>
              <option value="long_text">Texto longo</option>
              <option value="number">Número</option>
              <option value="date">Data</option>
              <option value="single_choice">Escolha única</option>
              <option value="multi_choice">Múltipla escolha</option>
              <option value="stars">Estrelas</option>
              <option value="scale">Escala</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <div className="form-check">
              <input
                id={`req-${f._localId}`}
                className="form-check-input"
                type="checkbox"
                checked={!!f.required}
                onChange={(e) => patch(f._localId, (ff) => ({ ...ff, required: e.target.checked }))}
              />
              <label className="form-check-label" htmlFor={`req-${f._localId}`}>Obrigatório</label>
            </div>
          </div>
        </div>

        {(f.type === 'single_choice' || f.type === 'multi_choice') && (
          <div className="mt-3">
            <label className="form-label">Opções</label>
            {(f.options ?? []).map((op) => (
              <div key={op.id} className="d-flex align-items-center gap-2 mb-2">
                {f.type === 'single_choice' ? (
                  <input type="radio" className="form-check-input" disabled />
                ) : (
                  <input type="checkbox" className="form-check-input" disabled />
                )}
                <input
                  className="form-control"
                  value={op.label}
                  onFocus={() => setActiveId(f._localId)}
                  onChange={(e) => setOption(f._localId, op.id, e.target.value)}
                />
                <button type="button" className="btn btn-sm btn-light" onClick={() => removeOption(f._localId, op.id)}>Remover</button>
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-light" onClick={() => addOption(f._localId)}>+ Adicionar opção</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {items.length === 0 && (
        <div className="alert alert-info">Nenhuma pergunta ainda. Clique em um dos botões abaixo para adicionar.</div>
      )}

      {items.map(renderItem)}

      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-light" onClick={() => addField('short_text')}>+ Texto curto</button>
        <button type="button" className="btn btn-light" onClick={() => addField('long_text')}>+ Texto longo</button>
        <button type="button" className="btn btn-light" onClick={() => addField('number')}>+ Número</button>
        <button type="button" className="btn btn-light" onClick={() => addField('date')}>+ Data</button>
        <button type="button" className="btn btn-light" onClick={() => addField('single_choice')}>+ Escolha única</button>
        <button type="button" className="btn btn-light" onClick={() => addField('multi_choice')}>+ Múltipla escolha</button>
        <button type="button" className="btn btn-light" onClick={() => addField('stars')}>+ Estrelas</button>
        <button type="button" className="btn btn-light" onClick={() => addField('scale')}>+ Escala</button>
      </div>
    </div>
  )
}