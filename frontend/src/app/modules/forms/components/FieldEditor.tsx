// src/app/modules/forms/components/FieldEditor.tsx
import React from 'react';
import { Form } from 'react-bootstrap';
import { TranslatableString } from '../services/api';
import LanguageTabs from './LanguageTabs';

export type Field = {
  id?: string;
  type:
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'date'
  | 'multi_choice'
  | 'single_choice'
  | 'stars'
  | 'scale';
  label: TranslatableString;
  required?: boolean;
  // 🔥 ATUALIZADO: Label da opção agora é TranslatableString
  options?: { id: string; label: TranslatableString }[] | null;
  order: number;
};

type Props = {
  fields: Field[];
  onChange: (fields: Field[]) => void;
  locales: string[];
  allowedTypes?: Field['type'][];
  maxFields?: number;
};

const genId = () => Math.random().toString(36).slice(2, 10);

// Helper para garantir que a opção seja traduzível (migração de dados antigos)
const normalizeOptionLabel = (val: any, defaultLocale = 'pt-BR'): TranslatableString => {
  if (typeof val === 'string') return { [defaultLocale]: val };
  if (typeof val === 'object' && val !== null) return val;
  return { [defaultLocale]: '' };
};

export default function FieldEditor({ fields, onChange, locales, allowedTypes, maxFields }: Props) {
  // ... (existing state)
  const sorted = React.useMemo(
    () => [...(fields ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [fields],
  );

  // ... (existing commit and helpers)
  const commit = (next: Field[]) => {
    const norm = [...next]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((f, idx) => ({ ...f, order: idx }));
    onChange(norm);
  };

  const addField = (type: Field['type']) => {
    if (maxFields && sorted.length >= maxFields) return;
    const next: Field = {
      id: `tmp_${genId()}`,
      type,
      label: { 'pt-BR': '' },
      required: false,
      options:
        type === 'multi_choice' || type === 'single_choice'
          ? [
            { id: genId(), label: { 'pt-BR': 'Opção 1' } },
            { id: genId(), label: { 'pt-BR': 'Opção 2' } },
          ]
          : null,
      order: sorted.length,
    };
    commit([...sorted, next]);
  };

  const updateField = (id: string | undefined, patch: Partial<Field>) => {
    const next = sorted.map((f) => (f.id === id ? { ...f, ...patch } : f));
    commit(next);
  };

  const removeField = (id: string | undefined) => {
    const next = sorted.filter((f) => f.id !== id);
    commit(next);
  };

  const moveField = (id: string | undefined, dir: -1 | 1) => {
    const idx = sorted.findIndex((f) => f.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= sorted.length) return;
    const next = [...sorted];
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    commit(next);
  };

  // 🔥 ATUALIZADO: Seta o valor de uma tradução específica de uma opção
  const setOptionLabel = (fieldId: string | undefined, optId: string, locale: string, val: string) => {
    const field = sorted.find((f) => f.id === fieldId);
    if (!field) return;
    const opts = (field.options ?? []).map((o) => {
      if (o.id === optId) {
        return {
          ...o,
          label: { ...normalizeOptionLabel(o.label), [locale]: val },
        };
      }
      return o;
    });
    updateField(fieldId, { options: opts });
  };

  const addOption = (fieldId: string | undefined) => {
    const field = sorted.find((f) => f.id === fieldId);
    if (!field) return;
    const opts = [...(field.options ?? [])];
    opts.push({ id: genId(), label: { 'pt-BR': `Opção ${opts.length + 1}` } });
    updateField(fieldId, { options: opts });
  };

  const removeOption = (fieldId: string | undefined, optId: string) => {
    const field = sorted.find((f) => f.id === fieldId);
    if (!field) return;
    const opts = (field.options ?? []).filter((o) => o.id !== optId);
    updateField(fieldId, { options: opts });
  };

  const isTypeAllowed = (t: Field['type']) => !allowedTypes || allowedTypes.includes(t);

  return (
    <div>
      {sorted.length === 0 && (
        <div className="alert alert-info">
          Nenhuma pergunta ainda. Clique em um dos botões abaixo para adicionar.
        </div>
      )}

      {sorted.map((f, i) => (
        <div key={f.id} className="border rounded p-3 mb-3 bg-white">
          <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
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

          <div className="row g-3">
            <div className="col-12">
              <Form.Group>
                <Form.Label>Enunciado</Form.Label>
                <LanguageTabs
                  locales={locales}
                  values={f.label}
                  onChange={(locale, value) => {
                    updateField(f.id, { label: { ...f.label, [locale]: value } });
                  }}
                />
              </Form.Group>
            </div>

            <div className="col-md-9">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={f.type}
                onChange={(e) => {
                  const t = e.target.value as Field['type'];
                  if (t === 'multi_choice' || t === 'single_choice') {
                    updateField(f.id, {
                      type: t,
                      options:
                        f.options && f.options.length > 0
                          ? f.options
                          : [
                            { id: genId(), label: { 'pt-BR': 'Opção 1' } },
                            { id: genId(), label: { 'pt-BR': 'Opção 2' } },
                          ],
                    });
                  } else {
                    updateField(f.id, { type: t, options: null });
                  }
                }}
              >
                {isTypeAllowed('short_text') && <option value="short_text">Texto curto</option>}
                {isTypeAllowed('long_text') && <option value="long_text">Texto longo</option>}
                {isTypeAllowed('number') && <option value="number">Número</option>}
                {isTypeAllowed('date') && <option value="date">Data</option>}
                {isTypeAllowed('single_choice') && <option value="single_choice">Escolha única</option>}
                {isTypeAllowed('multi_choice') && <option value="multi_choice">Múltipla escolha</option>}
                {isTypeAllowed('stars') && <option value="stars">Estrelas</option>}
                {isTypeAllowed('scale') && <option value="scale">Escala</option>}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <div className="form-check mb-2">
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
            <div className="mt-4 ps-3 border-start">
              <label className="form-label fw-bold">Opções de Resposta</label>
              {(f.options ?? []).map((op) => (
                <div key={op.id} className="d-flex align-items-start gap-2 mb-3">
                  <div className="pt-2">
                    {f.type === 'single_choice' ? (
                      <input type="radio" className="form-check-input" disabled />
                    ) : (
                      <input type="checkbox" className="form-check-input" disabled />
                    )}
                  </div>

                  <div className="flex-grow-1">
                    {/* 🔥 ATUALIZADO: LanguageTabs para cada opção */}
                    <LanguageTabs
                      locales={locales}
                      values={normalizeOptionLabel(op.label)}
                      onChange={(loc, val) => setOptionLabel(f.id, op.id, loc, val)}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-light text-danger mt-1"
                    onClick={() => removeOption(f.id, op.id)}
                    title="Remover opção"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-light text-primary"
                onClick={() => addOption(f.id)}
              >
                + Adicionar opção
              </button>
            </div>
          )}
        </div>
      ))}

      {(!maxFields || sorted.length < maxFields) && (
        <div className="d-flex flex-wrap gap-2 mt-4">
          {isTypeAllowed('short_text') && <button type="button" className="btn btn-light" onClick={() => addField('short_text')}>+ Texto curto</button>}
          {isTypeAllowed('long_text') && <button type="button" className="btn btn-light" onClick={() => addField('long_text')}>+ Texto longo</button>}
          {isTypeAllowed('single_choice') && <button type="button" className="btn btn-light" onClick={() => addField('single_choice')}>+ Escolha única</button>}
          {isTypeAllowed('multi_choice') && <button type="button" className="btn btn-light" onClick={() => addField('multi_choice')}>+ Múltipla escolha</button>}
          {isTypeAllowed('stars') && <button type="button" className="btn btn-light" onClick={() => addField('stars')}>+ Estrelas</button>}
          {isTypeAllowed('scale') && <button type="button" className="btn btn-light" onClick={() => addField('scale')}>+ Escala (NPS)</button>}
          {isTypeAllowed('date') && <button type="button" className="btn btn-light" onClick={() => addField('date')}>+ Data</button>}
          {isTypeAllowed('number') && <button type="button" className="btn btn-light" onClick={() => addField('number')}>+ Número</button>}
        </div>
      )}
    </div>
  );
}