// src/app/modules/forms/components/AudiencePicker.tsx
// (Nenhuma alteração necessária, este arquivo está correto)

import React from 'react';
import { FormsApi } from '../services/api';

type Value = { spaceIds: string[]; groupIds: string[] };
type Props = { value: Value; onChange: (v: Value) => void };

export default function AudiencePicker({ value, onChange }: Props) {
  const [segments, setSegments] = React.useState<{ spaces: any[]; groups: any[] }>({
    spaces: [],
    groups: [],
  });
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // forçar mostrar selects mesmo se arrays estiverem vazias
  const [forceShow, setForceShow] = React.useState(false);

  const isEmpty = (value.spaceIds?.length ?? 0) === 0 && (value.groupIds?.length ?? 0) === 0;
  const entireCompany = !forceShow && isEmpty;

  React.useEffect(() => {
    if (entireCompany) return;
    let mounted = true;
    setLoading(true);
    setErr(null);
    FormsApi.segmentationOptions()
      .then((res) => {
        if (!mounted) return;
        const spaces = Array.isArray(res?.spaces) ? res.spaces : [];
        const groups = Array.isArray(res?.groups) ? res.groups : [];
        setSegments({ spaces, groups });
      })
      .catch(async (e: any) => {
        try {
          // Fallback manual (não deveria ser necessário se a API estiver correta)
          const r = await fetch('/forms/segments', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          });
          if (r.ok) {
            const j = await r.json();
            const spaces = Array.isArray(j?.spaces) ? j.spaces : [];
            const groups = Array.isArray(j?.groups) ? j.groups : [];
            setSegments({ spaces, groups });
            return;
          }
        } catch (_) {}
        setErr(String(e?.message || 'Falha ao carregar segmentos'));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [entireCompany]);

  return (
    <div className="border rounded p-3">
      <div className="form-check mb-3">
        <input
          id="entireCompany"
          className="form-check-input"
          type="checkbox"
          checked={entireCompany}
          onChange={(e) => {
            const on = e.target.checked;
            if (on) {
              setForceShow(false);
              onChange({ spaceIds: [], groupIds: [] });
            } else {
              // desmarcou -> mostra selects
              setForceShow(true);
              onChange({ spaceIds: [], groupIds: [] });
            }
          }}
        />
        <label className="form-check-label" htmlFor="entireCompany">
          Enviar para a empresa inteira
        </label>
      </div>

      {!entireCompany && (
        <>
          {loading && <div>Carregando espaços e grupos…</div>}
          {err && <div className="alert alert-danger">{err}</div>}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Spaces</label>
              <select
                multiple
                className="form-select"
                value={value.spaceIds ?? []}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                  onChange({ ...value, spaceIds: vals });
                }}
              >
                {segments.spaces.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Grupos</label>
              <select
                multiple
                className="form-select"
                value={value.groupIds ?? []}
                onChange={(e) => {
                  const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                  onChange({ ...value, groupIds: vals });
                }}
              >
                {segments.groups.map((g: any) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}