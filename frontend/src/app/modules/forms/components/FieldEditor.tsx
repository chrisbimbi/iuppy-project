// src/modules/forms/components/FieldEditor.tsx
import React from 'react'

export type Field = {
  id?: string
  type:
    | 'short_text'
    | 'long_text'
    | 'number'
    | 'date'
    | 'multi_choice'
    | 'single_choice'
    | 'stars'
    | 'scale'
  label: string
  required?: boolean
  options?: { id: string; label: string }[] | null
  order: number
}

type Props = {
  fields: Field[]
  onChange: (fields: Field[]) => void
}

const genId = () => Math.random().toString(36).slice(2, 10)

export default function FieldEditor({ fields, onChange }: Props) {
  // sempre trabalha com a lista ordenada
  const sorted = React.useMemo(
    () => [...(fields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [fields],
  )

  const commit = (next: Field[]) => {
    // reordena e normaliza order
    const norm = [...next]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((f, idx) => ({ ...f, order: idx }))
    onChange(norm)
  }

  const addField = (type: Field['type']) => {
    const next: Field = {
      id: `tmp_${genId()}`,
      type,
      label: '',
      required: false,
      options:
        type === 'multi_choice' || type === 'single_choice'
          ? [
              { id: genId(), label: 'Opção 1' },
              { id: genId(), label: 'Opção 2' },
            ]
          : null,
      order: sorted.length,
    }
    commit([...sorted, next])
  }

  const updateField = (id: string | undefined, patch: Partial<Field>) => {
    const next = sorted.map((f) =>
      f.id === id ? { ...f, ...patch } : f,
    )
    commit(next)
  }

  const removeField = (id: string | undefined) => {
    const next = sorted.filter((f) => f.id !== id)
    commit(next)
  }

  const moveField = (id: string | undefined, dir: -1 | 1) => {
    const idx = sorted.findIndex((f) => f.id === id)
    const j = idx + dir
    if (idx < 0 || j < 0 || j >= sorted.length) return
    const next = [...sorted]
    const tmp = next[idx]
    next[idx] = next[j]
    next[j] = tmp
    commit(next)
  }

  const setOption = (fieldId: string | undefined, optId: string, label: string) => {
    const field = sorted.find((f) => f.id === fieldId)
    if (!field) return
    const opts = (field.options ?? []).map((o) =>
      o.id === optId ? { ...o, label } : o,
    )
    updateField(fieldId, { options: opts })
  }

  const addOption = (fieldId: string | undefined) => {
    const field = sorted.find((f) => f.id === fieldId)
    if (!field) return
    const opts = [...(field.options ?? [])]
    opts.push({ id: genId(), label: `Opção ${opts.length + 1}` })
    updateField(fieldId, { options: opts })
  }

  const removeOption = (fieldId: string | undefined, optId: string) => {
    const field = sorted.find((f) => f.id === fieldId)
    if (!field) return
    const opts = (field.options ?? []).filter((o) => o.id !== optId)
    updateField(fieldId, { options: opts })
  }

  return (
    <div>
      {sorted.length === 0 && (
        <div className="alert alert-info">
          Nenhuma pergunta ainda. Clique em um dos botões abaixo para adicionar.
        </div>
      )}

      {sorted.map((f, i) => (
        <div key={f.id} className="border rounded p-3 mb-3">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <strong className="me-auto">Pergunta #{i + 1}</strong>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => moveField(f.id, -1)}
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => moveField(f.id, 1)}
                disabled={i === sorted.length - 1}
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => removeField(f.id)}
            >
              Apagar
            </button>
          </div>

          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <label className="form-label">Enunciado</label>
              <input
                className="form-control"
                value={f.label}
                onChange={(e) => updateField(f.id, { label: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={f.type}
                onChange={(e) => {
                  const t = e.target.value as Field['type']
                  if (t === 'multi_choice' || t === 'single_choice') {
                    updateField(f.id, {
                      type: t,
                      options:
                        f.options && f.options.length > 0
                          ? f.options
                          : [
                              { id: genId(), label: 'Opção 1' },
                              { id: genId(), label: 'Opção 2' },
                            ],
                    })
                  } else {
                    updateField(f.id, { type: t, options: null })
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
                  id={`req-${f.id}`}
                  className="form-check-input"
                  type="checkbox"
                  checked={!!f.required}
                  onChange={(e) => updateField(f.id, { required: e.target.checked })}
                />
                <label className="form-check-label" htmlFor={`req-${f.id}`}>
                  Obrigatório
                </label>
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
                    onChange={(e) => setOption(f.id, op.id, e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => removeOption(f.id, op.id)}
                  >
                    Remover
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => addOption(f.id)}
              >
                + Adicionar opção
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="d-flex flex-wrap gap-2">
        <button type="button" className="btn btn-light" onClick={() => addField('short_text')}>
          + Texto curto
        </button>
        <button type="button" className="btn btn-light" onClick={() => addField('long_text')}>
          + Texto longo
        </button>
        <button type="button" className="btn btn-light" onClick={() => addField('number')}>
          + Número
        </button>
        <button type="button" className="btn btn-light" onClick={() => addField('date')}>
          + Data
        </button>
        <button type="button" className="btn btn-light" onClick={() => addField('single_choice')}>
          + Escolha única
        </button>
        <button type="button" className="btn btn-light" onClick={() => addField('multi_choice')}>
          + Múltipla escolha
        </button>
        <button type="button" className="btn btn-light" onClick={() => addField('stars')}>
          + Estrelas
        </button>
        <button type="button" className="btn btn-light" onClick={() => addField('scale')}>
          + Escala
        </button>
      </div>
    </div>
  )
}
