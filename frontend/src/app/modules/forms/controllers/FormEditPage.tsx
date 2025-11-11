// src/modules/forms/controllers/FormEditPage.tsx
import React from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Modal, Button } from 'react-bootstrap'
import { FormsApi } from '../services/api'
import StepHeader from '../components/StepHeader'
import AudiencePicker from '../components/AudiencePicker'
import FieldEditor from '../components/FieldEditor'
import FormEmailSettingsModal from '../components/FormsEmailSettingsModal'


type Field = {
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
  options?: any
  order: number
}

type FormPayload = {
  title: string
  description?: string
  status: 'draft' | 'published' | 'expired' | 'archived'
  scheduleStartAt?: string | null
  scheduleEndAt?: string | null
  deadlineAt?: string | null
  allowMultipleSubmissions?: boolean
  anonymous?: boolean
  allowExternal?: boolean
  audienceSpaceIds?: string[]
  audienceGroupIds?: string[]
  attachmentsAllowed?: boolean
  allowAttachments?: boolean
  attachmentHelpText?: string | null
  remindersConfig?: { offsets?: string[] } | any
  notificationsConfig?: {
    push?: boolean
    email?: boolean
    pushPayload?: { title: string; body: string }
    [k: string]: any
  } | null
  acl?: any
  fields?: Field[]
  requiresApproval?: boolean
  allowTranslations?: boolean
  defaultLocale?: string
}

const uuidV4Regex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isUuidV4 = (s?: string) => !!s && uuidV4Regex.test(s)

const STEPS = [
  { key: 'basics', title: 'Informações básicas' },
  { key: 'audience', title: 'Segmentação' },
  { key: 'settings', title: 'Configurações' },
  { key: 'fields', title: 'Perguntas' },
  { key: 'review', title: 'Revisão & Publicação' },
] as const
type StepKey = (typeof STEPS)[number]['key']

export default function FormEditPage() {
  const { formId } = useParams<{ formId?: string }>()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()

  const isNew = !formId || formId === 'new' || !isUuidV4(formId)
  const stepFromUrl = (sp.get('step') as StepKey) || 'basics'
  const [step, setStep] = React.useState<StepKey>(stepFromUrl)

  const [model, setModel] = React.useState<FormPayload>({
    title: '',
    description: '',
    status: 'draft',
    scheduleStartAt: null,
    scheduleEndAt: null,
    deadlineAt: null,
    allowMultipleSubmissions: false,
    anonymous: false,
    allowExternal: false,
    audienceSpaceIds: [],
    audienceGroupIds: [],
    attachmentsAllowed: false,
    allowAttachments: false,
    attachmentHelpText: null,
    remindersConfig: { offsets: [] },
    notificationsConfig: { push: false, email: false, pushPayload: { title: '', body: '' } },
    acl: { owners: [], editors: [], viewers: [] },
    fields: [],
    requiresApproval: false,
    allowTranslations: false,
    defaultLocale: 'pt-BR',
  })
  const [loading, setLoading] = React.useState(!isNew)
  const [saving, setSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const [schedStartOn, setSchedStartOn] = React.useState(false)
  const [schedEndOn, setSchedEndOn] = React.useState(false)
  const [deadlineOn, setDeadlineOn] = React.useState(false)
  const [pushOn, setPushOn] = React.useState(false)

  const [showEmailModal, setShowEmailModal] = React.useState(false)

  const [showPushModal, setShowPushModal] = React.useState(false)
  const [pushTitleDraft, setPushTitleDraft] = React.useState('')
  const [pushBodyDraft, setPushBodyDraft] = React.useState('')

  React.useEffect(() => {
    if (isNew) return
    let mounted = true
    setLoading(true)
    FormsApi.get(formId!)
      .then((data) => {
        if (!mounted) return
        const d: any = data || {}

        const attachmentsFlag = d.attachmentsAllowed === true || d.allowAttachments === true

        const notifCfg = d.notificationsConfig ?? { push: false, email: false }
        const notifPushPayload = notifCfg.pushPayload ?? { title: '', body: '' }

        setModel((m) => ({
          ...m,
          ...d,
          fields: d.fields ?? [],
          audienceSpaceIds: d.audienceSpaceIds ?? [],
          audienceGroupIds: d.audienceGroupIds ?? [],
          remindersConfig: d.remindersConfig ?? { offsets: [] },
          notificationsConfig: {
            ...(notifCfg || {}),
            pushPayload: notifPushPayload,
          },
          requiresApproval: !!d.requiresApproval,
          allowTranslations: !!d.allowTranslations,
          defaultLocale: d.defaultLocale ?? 'pt-BR',
          attachmentsAllowed: attachmentsFlag,
          allowAttachments: attachmentsFlag,
          anonymous: !!d.anonymous,
        }))
        setSchedStartOn(!!d.scheduleStartAt)
        setSchedEndOn(!!d.scheduleEndAt)
        setDeadlineOn(!!d.deadlineAt)
        setPushOn(!!notifCfg?.push)
        setPushTitleDraft(notifPushPayload.title || '')
        setPushBodyDraft(notifPushPayload.body || '')
      })
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [formId, isNew])

  React.useEffect(() => {
    setSp(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('step', step)
        return next
      },
      { replace: true },
    )
  }, [step, setSp])

  const stepIndex = (k: StepKey) => Math.max(0, STEPS.findIndex((s) => s.key === k))
  const nextStepKey = (k: StepKey): StepKey => {
    const idx = stepIndex(k)
    const next = Math.min(STEPS.length - 1, idx + 1)
    return STEPS[next].key as StepKey
  }

  const goStep = (delta: number) => {
    const idx = Math.max(0, Math.min(STEPS.length - 1, stepIndex(step) + delta))
    setStep(STEPS[idx].key as StepKey)
  }

  // monta payload final sempre com todos os booleans bem definidos
  const buildPayload = (base: FormPayload): FormPayload => {
    const attachments = !!base.attachmentsAllowed || !!base.allowAttachments
    const notif =
      base.notificationsConfig ?? ({ push: false, email: false } as FormPayload['notificationsConfig'])
    return {
      ...base,
      anonymous: !!base.anonymous,
      allowExternal: !!base.allowExternal,
      allowMultipleSubmissions: !!base.allowMultipleSubmissions,
      attachmentsAllowed: attachments,
      allowAttachments: attachments,
      notificationsConfig: {
        ...(notif || {}),
        push: !!notif?.push,
      },
    }
  }

  const saveDraft = async () => {
    const payloadToSend = buildPayload(model)
    console.log('[forms] saveDraft payload =>', payloadToSend)
    setSaving(true)
    setErr(null)
    try {
      if (isNew) {
        const created = await FormsApi.create(payloadToSend)
        nav(`/forms/${created.id}/edit?step=${step}`, { replace: true })
      } else {
        await FormsApi.update(formId!, payloadToSend)
      }
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const saveAndNext = async () => {
    const payloadToSend = buildPayload(model)
    console.log('[forms] saveAndNext payload =>', payloadToSend)
    setSaving(true)
    setErr(null)
    try {
      if (isNew) {
        const created = await FormsApi.create(payloadToSend)
        nav(`/forms/${created.id}/edit?step=${nextStepKey(step)}`, { replace: true })
      } else {
        await FormsApi.update(formId!, payloadToSend)
        goStep(1)
      }
    } catch (e: any) {
      setErr(String(e?.message || e))
    } finally {
      setSaving(false)
    }
  }

  const publish = async () => {
    const payloadToSend = buildPayload({ ...model, status: 'published' })
    console.log('[forms] publish payload =>', payloadToSend)
    setModel((m) => ({ ...m, status: 'published' }))
    try {
      await FormsApi.update(formId!, payloadToSend)
      nav('/forms')
    } catch (e: any) {
      setErr(String(e?.message || e))
    }
  }

  const toLocalInputValue = (iso?: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`
  }
  const fromLocalInputValue = (v: string) => (v ? new Date(v).toISOString() : null)

  const setDeadline18hLocal = () => {
    const d = new Date()
    d.setHours(18, 0, 0, 0)
    setModel((m) => ({ ...m, deadlineAt: d.toISOString() }))
    setDeadlineOn(true)
  }

  const renderBasics = () => (
    <div className="row g-4">
      <div className="col-md-7">
        <label className="form-label">Título</label>
        <input
          className="form-control"
          value={model.title}
          onChange={(e) => setModel((m) => ({ ...m, title: e.target.value }))}
          required
        />
      </div>
      <div className="col-md-5">
        <label className="form-label">Status</label>
        <select
          className="form-select"
          value={model.status}
          onChange={(e) => setModel((m) => ({ ...m, status: e.target.value as any }))}
        >
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="expired">Expirado</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>
      <div className="col-12">
        <label className="form-label">Descrição</label>
        <textarea
          className="form-control"
          rows={3}
          value={model.description ?? ''}
          onChange={(e) => setModel((m) => ({ ...m, description: e.target.value }))}
        />
      </div>
      <div className="col-md-4">
        <div className="form-check mt-2">
          <input
            id="anonymous"
            className="form-check-input"
            type="checkbox"
            checked={!!model.anonymous}
            onChange={(e) => setModel((m) => ({ ...m, anonymous: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="anonymous">
            Formulário anônimo
          </label>
        </div>
      </div>

      <div className="col-md-4">
        <div className="form-check mt-2">
          <input
            id="allowTranslations"
            className="form-check-input"
            type="checkbox"
            checked={!!model.allowTranslations}
            onChange={(e) => setModel((m) => ({ ...m, allowTranslations: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="allowTranslations">
            Permitir tradução
          </label>
        </div>
      </div>
      <div className="col-md-4">
        <label className="form-label">Idioma padrão</label>
        <select
          className="form-select"
          value={model.defaultLocale ?? 'pt-BR'}
          onChange={(e) => setModel((m) => ({ ...m, defaultLocale: e.target.value }))}
        >
          <option value="pt-BR">Português (Brasil)</option>
          <option value="en-US">Inglês (EUA)</option>
          <option value="es-ES">Espanhol</option>
        </select>
      </div>
    </div>
  )

  const renderAudience = () => (
    <AudiencePicker
      value={{
        spaceIds: model.audienceSpaceIds ?? [],
        groupIds: model.audienceGroupIds ?? [],
      }}
      onChange={(val) =>
        setModel((m) => ({
          ...m,
          audienceSpaceIds: val.spaceIds,
          audienceGroupIds: val.groupIds,
        }))
      }
    />
  )

  const renderSettings = () => (
    <div className="row g-4">
      <div className="col-12">
        <div className="form-check form-switch">
          <input
            id="schedStart"
            className="form-check-input"
            type="checkbox"
            checked={schedStartOn}
            onChange={(e) => {
              const on = e.target.checked
              setSchedStartOn(on)
              setModel((m) => ({
                ...m,
                scheduleStartAt: on ? m.scheduleStartAt ?? new Date().toISOString() : null,
              }))
            }}
          />
          <label className="form-check-label" htmlFor="schedStart">
            Agendar início
          </label>
        </div>
      </div>
      {schedStartOn && (
        <div className="col-md-6">
          <label className="form-label">Início (data/hora)</label>
          <input
            type="datetime-local"
            className="form-control"
            value={toLocalInputValue(model.scheduleStartAt)}
            onChange={(e) =>
              setModel((m) => ({ ...m, scheduleStartAt: fromLocalInputValue(e.target.value) }))
            }
          />
        </div>
      )}

      <div className="col-12">
        <div className="form-check form-switch">
          <input
            id="schedEnd"
            className="form-check-input"
            type="checkbox"
            checked={schedEndOn}
            onChange={(e) => {
              const on = e.target.checked
              setSchedEndOn(on)
              setModel((m) => ({
                ...m,
                scheduleEndAt: on
                  ? m.scheduleEndAt ?? new Date(Date.now() + 86400000).toISOString()
                  : null,
              }))
            }}
          />
          <label className="form-check-label" htmlFor="schedEnd">
            Agendar expiração
          </label>
        </div>
      </div>
      {schedEndOn && (
        <div className="col-md-6">
          <label className="form-label">Expira em (data/hora)</label>
          <input
            type="datetime-local"
            className="form-control"
            value={toLocalInputValue(model.scheduleEndAt)}
            onChange={(e) =>
              setModel((m) => ({ ...m, scheduleEndAt: fromLocalInputValue(e.target.value) }))
            }
          />
        </div>
      )}

      <div className="col-12">
        <div className="form-check form-switch">
          <input
            id="deadlineOn"
            className="form-check-input"
            type="checkbox"
            checked={deadlineOn}
            onChange={(e) => {
              const on = e.target.checked
              setDeadlineOn(on)
              setModel((m) => ({
                ...m,
                deadlineAt: on ? m.deadlineAt ?? new Date().toISOString() : null,
              }))
              if (!on) {
                setModel((m) => ({
                  ...m,
                  remindersConfig: { ...(m.remindersConfig ?? {}), offsets: [] },
                }))
              }
            }}
          />
          <label className="form-check-label" htmlFor="deadlineOn">
            Exigir resposta até data
          </label>
        </div>
      </div>
      {deadlineOn && (
        <>
          <div className="col-md-6">
            <label className="form-label">Data limite</label>
            <div className="d-flex gap-2">
              <input
                type="datetime-local"
                className="form-control"
                value={toLocalInputValue(model.deadlineAt)}
                onChange={(e) =>
                  setModel((m) => ({ ...m, deadlineAt: fromLocalInputValue(e.target.value) }))
                }
              />
              <button type="button" className="btn btn-light" onClick={setDeadline18hLocal}>
                18h
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Lembretes</label>
            <div className="d-flex flex-wrap gap-3">
              {[
                { k: '-P1D', label: '1 dia antes' },
                { k: '-P2D', label: '2 dias antes' },
                { k: '-P7D', label: '1 semana antes' },
                { k: '-P15D', label: '15 dias antes' },
              ].map((opt) => {
                const checked = (model.remindersConfig?.offsets ?? []).includes(opt.k)
                return (
                  <div key={opt.k} className="form-check">
                    <input
                      id={`rem-${opt.k}`}
                      className="form-check-input"
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const offsets = new Set(model.remindersConfig?.offsets ?? [])
                        if (e.target.checked) offsets.add(opt.k)
                        else offsets.delete(opt.k)
                        setModel((m) => ({
                          ...m,
                          remindersConfig: {
                            ...(m.remindersConfig ?? {}),
                            offsets: Array.from(offsets),
                          },
                        }))
                      }}
                    />
                    <label className="form-check-label" htmlFor={`rem-${opt.k}`}>
                      {opt.label}
                    </label>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      <div className="col-md-4">
        <div className="form-check mt-2">
          <input
            id="allowMult"
            className="form-check-input"
            type="checkbox"
            checked={!!model.allowMultipleSubmissions}
            onChange={(e) =>
              setModel((m) => ({ ...m, allowMultipleSubmissions: e.target.checked }))
            }
          />
          <label className="form-check-label" htmlFor="allowMult">
            Permitir múltiplas submissões
          </label>
        </div>
      </div>
      <div className="col-md-4">
        <div className="form-check mt-2">
          <input
            id="allowExt"
            className="form-check-input"
            type="checkbox"
            checked={!!model.allowExternal}
            onChange={(e) => setModel((m) => ({ ...m, allowExternal: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="allowExt">
            Permitir externos
          </label>
        </div>
      </div>

      <div className="col-md-4">
        <div className="form-check form-switch mt-2 d-flex align-items-center gap-2">
          <input
            id="pushOn"
            className="form-check-input"
            type="checkbox"
            checked={pushOn}
            onChange={(e) => {
              const on = e.target.checked
              setPushOn(on)
              if (on) {
                setShowPushModal(true)
              } else {
                setModel((m) => ({
                  ...m,
                  notificationsConfig: { ...(m.notificationsConfig ?? {}), push: false },
                }))
              }
            }}
          />
          <label className="form-check-label" htmlFor="pushOn">
            Enviar push na publicação
          </label>
          {pushOn && (
            <button type="button" className="btn btn-link btn-sm" onClick={() => setShowPushModal(true)}>
              editar push
            </button>
          )}
        </div>
      </div>

      <div className="col-md-6">
        <div className="form-check mt-3">
          <input
            id="attachments"
            className="form-check-input"
            type="checkbox"
            checked={!!model.attachmentsAllowed || !!model.allowAttachments}
            onChange={(e) =>
              setModel((m) => ({
                ...m,
                attachmentsAllowed: e.target.checked,
                allowAttachments: e.target.checked,
              }))
            }
          />
          <label className="form-check-label" htmlFor="attachments">
            Permitir anexos
          </label>
        </div>
      </div>
      <div className="col-md-6">
        <label className="form-label">Ajuda para anexos (opcional)</label>
        <input
          className="form-control"
          placeholder="Limite, formatos, orientações..."
          value={model.attachmentHelpText ?? ''}
          onChange={(e) => setModel((m) => ({ ...m, attachmentHelpText: e.target.value || null }))}
        />
      </div>

      <div className="col-12">
        <div className="form-check mt-2">
          <input
            id="requiresApproval"
            className="form-check-input"
            type="checkbox"
            checked={!!model.requiresApproval}
            onChange={(e) => setModel((m) => ({ ...m, requiresApproval: e.target.checked }))}
          />
          <label className="form-check-label" htmlFor="requiresApproval">
            Para aprovação do RH?
          </label>
        </div>
      </div>

      <div className="col-12">
        {!isNew ? (
          <button type="button" className="btn btn-light" onClick={() => setShowEmailModal(true)}>
            Configurar e-mails de alerta
          </button>
        ) : (
          <div className="text-muted">Salve o formulário primeiro para configurar e-mails de alerta.</div>
        )}
      </div>
    </div>
  )

  const renderFields = () => (
    <FieldEditor fields={model.fields ?? []} onChange={(fields) => setModel((m) => ({ ...m, fields }))} />
  )

  const renderReview = () => {
    const attachments = !!model.attachmentsAllowed || !!model.allowAttachments
    const notif = model.notificationsConfig ?? {}
    return (
      <div className="p-3 space-y-4">
        <h5 className="mb-3">Resumo</h5>

        <div className="mb-3">
          <h6>Informações básicas</h6>
          <ul className="list-unstyled mb-0">
            <li>
              <strong>Título:</strong> {model.title || <em>(sem título)</em>}
            </li>
            <li>
              <strong>Status:</strong> {model.status}
            </li>
            <li>
              <strong>Descrição:</strong> {model.description || '-'}
            </li>
            <li>
              <strong>Idioma padrão:</strong> {model.defaultLocale ?? '-'}
            </li>
            <li>
              <strong>Formulário anônimo:</strong> {model.anonymous ? 'Sim' : 'Não'}
            </li>
            <li>
              <strong>Permitir tradução:</strong> {model.allowTranslations ? 'Sim' : 'Não'}
            </li>
          </ul>
        </div>

        <div className="mb-3">
          <h6>Segmentação</h6>
          <ul className="list-unstyled mb-0">
            <li>
              <strong>Spaces:</strong> {(model.audienceSpaceIds ?? []).length}
            </li>
            <li>
              <strong>Grupos:</strong> {(model.audienceGroupIds ?? []).length}
            </li>
          </ul>
        </div>

        <div className="mb-3">
          <h6>Configurações</h6>
          <ul className="list-unstyled mb-0">
            <li>
              <strong>Agendar início:</strong>{' '}
              {model.scheduleStartAt ? new Date(model.scheduleStartAt).toLocaleString() : 'Não'}
            </li>
            <li>
              <strong>Agendar expiração:</strong>{' '}
              {model.scheduleEndAt ? new Date(model.scheduleEndAt).toLocaleString() : 'Não'}
            </li>
            <li>
              <strong>Deadline:</strong>{' '}
              {model.deadlineAt ? new Date(model.deadlineAt).toLocaleString() : '-'}
            </li>
            <li>
              <strong>Lembretes:</strong>{' '}
              {(model.remindersConfig?.offsets ?? []).length
                ? (model.remindersConfig?.offsets ?? []).join(', ')
                : 'Nenhum'}
            </li>
            <li>
              <strong>Permitir múltiplas submissões:</strong>{' '}
              {model.allowMultipleSubmissions ? 'Sim' : 'Não'}
            </li>
            <li>
              <strong>Permitir externos:</strong> {model.allowExternal ? 'Sim' : 'Não'}
            </li>
            <li>
              <strong>Permitir anexos:</strong> {attachments ? 'Sim' : 'Não'}
            </li>
            <li>
              <strong>Ajuda para anexos:</strong> {model.attachmentHelpText || '-'}
            </li>
            <li>
              <strong>Para aprovação do RH:</strong> {model.requiresApproval ? 'Sim' : 'Não'}
            </li>
            <li>
              <strong>Push na publicação:</strong> {notif.push ? 'Sim' : 'Não'}
            </li>
          </ul>
        </div>

        <div className="mb-3">
          <h6>Perguntas</h6>
          <p className="mb-0">
            <strong>Total:</strong> {(model.fields ?? []).length} pergunta(s)
          </p>
        </div>

        <div className="alert alert-info mt-3 mb-0">
          Publicar muda o status para <strong>published</strong>.
        </div>
      </div>
    )
  }

  const actions = (
    <div className="d-flex gap-2">
      <button type="button" className="btn btn-light" onClick={() => nav('/forms')} disabled={saving}>
        Cancelar
      </button>
      {step !== 'review' ? (
        <>
          <button type="button" className="btn btn-light" onClick={saveDraft} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar rascunho'}
          </button>
          <button type="button" className="btn btn-primary" onClick={saveAndNext} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar e continuar'}
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-light" onClick={saveDraft} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar rascunho'}
          </button>
          {!isNew && (
            <button type="button" className="btn btn-success" onClick={publish} disabled={saving}>
              Publicar
            </button>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      <div className="card">
        <div className="card-header align-items-center justify-content-between">
          <h3 className="card-title">{isNew ? 'Criar formulário' : 'Editar formulário'}</h3>
          {actions}
        </div>
        <div className="card-body">
          {err && <div className="alert alert-danger mb-4">{err}</div>}
          {loading ? (
            <div>Carregando…</div>
          ) : (
            <>
              <StepHeader
                steps={STEPS.map((s) => ({ key: s.key, title: s.title }))}
                currentKey={step}
                onStepClick={(k) => setStep(k as StepKey)}
              />
              {step === 'basics' && renderBasics()}
              {step === 'audience' && renderAudience()}
              {step === 'settings' && renderSettings()}
              {step === 'fields' && renderFields()}
              {step === 'review' && renderReview()}
            </>
          )}
        </div>
        <div className="card-footer d-flex justify-content-between">
          <button
            className="btn btn-light"
            onClick={() => goStep(-1)}
            disabled={STEPS.findIndex((s) => s.key === step) === 0}
          >
            Voltar
          </button>
          {actions}
        </div>
      </div>

      {!isNew && (
        <FormEmailSettingsModal
          show={showEmailModal}
          onHide={() => setShowEmailModal(false)}
          formId={formId!}
        />
      )}

      {/* modal de push */}
      <Modal
        show={showPushModal}
        onHide={() => {
          // se não tem conteúdo, desliga
          if (!pushTitleDraft && !pushBodyDraft) {
            setPushOn(false)
            setModel((m) => ({
              ...m,
              notificationsConfig: { ...(m.notificationsConfig ?? {}), push: false },
            }))
          }
          setShowPushModal(false)
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>Push da publicação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Título</label>
            <input
              className="form-control"
              value={pushTitleDraft}
              onChange={(e) => setPushTitleDraft(e.target.value)}
              placeholder="Ex.: Novo formulário disponível"
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Mensagem</label>
            <textarea
              className="form-control"
              rows={3}
              value={pushBodyDraft}
              onChange={(e) => setPushBodyDraft(e.target.value)}
              placeholder="Ex.: Preencha até amanhã para não ficar pendente."
            />
          </div>
          <div className="text-muted small">Igual ao de communication: título + texto.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              if (!pushTitleDraft && !pushBodyDraft) {
                setPushOn(false)
                setModel((m) => ({
                  ...m,
                  notificationsConfig: { ...(m.notificationsConfig ?? {}), push: false },
                }))
              }
              setShowPushModal(false)
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setModel((m) => ({
                ...m,
                notificationsConfig: {
                    ...(m.notificationsConfig ?? {}),
                    push: true,
                    pushPayload: { title: pushTitleDraft, body: pushBodyDraft },
                },
              }))
              setShowPushModal(false)
            }}
          >
            Salvar push
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}