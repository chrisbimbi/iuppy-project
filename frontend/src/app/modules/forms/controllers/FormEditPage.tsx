// src/app/modules/forms/controllers/FormEditPage.tsx
import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Modal, Button, Form } from 'react-bootstrap';
import { FormsApi, TranslatableString } from '../services/api';
import StepHeader from '../components/StepHeader';
import AudiencePicker from '../components/AudiencePicker';
import FieldEditor, { Field } from '../components/FieldEditor';
import FormEmailSettingsModal from '../components/FormsEmailSettingsModal';
import LanguageTabs from '../components/LanguageTabs';

type FormPayload = {
  title: TranslatableString;
  description?: TranslatableString | null;
  status: 'draft' | 'published' | 'expired' | 'archived';
  scheduleStartAt?: string | null;
  scheduleEndAt?: string | null;
  deadlineAt?: string | null;
  allowMultipleSubmissions?: boolean;
  anonymous?: boolean;
  allowExternal?: boolean;
  audienceSpaceIds?: string[];
  audienceGroupIds?: string[];
  attachmentsAllowed?: boolean;
  allowAttachments?: boolean;
  attachmentHelpText?: TranslatableString | null;
  remindersConfig?: { offsets?: string[] } | any;
  notificationsConfig?: {
    push?: boolean;
    email?: boolean;
    pushPayload?: { title: TranslatableString; body: TranslatableString };
    [k: string]: any;
  } | null;
  acl?: any;
  fields?: Field[];
  requiresApproval?: boolean;
  allowTranslations?: boolean;
  defaultLocale?: string;
};

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuidV4 = (s?: string) => !!s && uuidV4Regex.test(s);

const STEPS = [
  { key: 'basics', title: 'Informações básicas' },
  { key: 'audience', title: 'Segmentação' },
  { key: 'settings', title: 'Configurações' },
  { key: 'fields', title: 'Perguntas' },
  { key: 'review', title: 'Revisão & Publicação' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];

export default function FormEditPage() {
  const { formId } = useParams<{ formId?: string }>();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();

  const isNew = !formId || formId === 'new' || !isUuidV4(formId);
  const stepFromUrl = (sp.get('step') as StepKey) || 'basics';
  const [step, setStep] = React.useState<StepKey>(stepFromUrl);

  // Estado para controlar se o form JÁ ESTAVA publicado no banco.
  // Isso evita despublicar acidentalmente um form que já estava live,
  // mas garante que novos forms nasçam como draft até o final.
  const [originalStatus, setOriginalStatus] = React.useState<string>('draft');

  const [model, setModel] = React.useState<FormPayload>({
    title: { 'pt-BR': '' },
    description: { 'pt-BR': '' },
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
    attachmentHelpText: { 'pt-BR': '' },
    remindersConfig: { offsets: [] },
    notificationsConfig: {
      push: false,
      email: false,
      pushPayload: { title: { 'pt-BR': '' }, body: { 'pt-BR': '' } }
    },
    acl: { owners: [], editors: [], viewers: [] },
    fields: [],
    requiresApproval: false,
    allowTranslations: false,
    defaultLocale: 'pt-BR',
  });

  const [availableLocales, setAvailableLocales] = React.useState(['pt-BR']);
  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const [schedStartOn, setSchedStartOn] = React.useState(false);
  const [schedEndOn, setSchedEndOn] = React.useState(false);
  const [deadlineOn, setDeadlineOn] = React.useState(false);
  const [pushOn, setPushOn] = React.useState(false);

  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showPushModal, setShowPushModal] = React.useState(false);

  const [pushTitleDraft, setPushTitleDraft] = React.useState<TranslatableString>({ 'pt-BR': '' });
  const [pushBodyDraft, setPushBodyDraft] = React.useState<TranslatableString>({ 'pt-BR': '' });

  const normalizeTranslatable = (field: any, defaultLocale = 'pt-BR'): TranslatableString => {
    if (!field) return { [defaultLocale]: '' };
    if (typeof field === 'string') return { [defaultLocale]: field };
    if (Object.keys(field).length === 0) return { [defaultLocale]: '' };
    return field;
  };

  React.useEffect(() => {
    if (isNew) return;
    let mounted = true;
    setLoading(true);
    FormsApi.get(formId!)
      .then((data) => {
        if (!mounted) return;
        const d: any = data || {};
        const defaultLocale = d.defaultLocale ?? 'pt-BR';

        const attachmentsFlag = d.attachmentsAllowed === true || d.allowAttachments === true;
        const notifCfg = d.notificationsConfig ?? { push: false, email: false };

        const rawPushPayload = notifCfg.pushPayload ?? {};
        const pushPayload = {
          title: normalizeTranslatable(rawPushPayload.title, defaultLocale),
          body: normalizeTranslatable(rawPushPayload.body, defaultLocale),
        };

        // Salva o status original do banco
        setOriginalStatus(d.status || 'draft');

        setModel((m) => ({
          ...m,
          ...d,
          title: normalizeTranslatable(d.title, defaultLocale),
          description: normalizeTranslatable(d.description, defaultLocale),
          attachmentHelpText: normalizeTranslatable(d.attachmentHelpText, defaultLocale),
          fields: (d.fields ?? []).map((f: any) => ({
            ...f,
            label: normalizeTranslatable(f.label, defaultLocale),
            options: (f.options || []).map((op: any) => ({
              id: op.id,
              label: normalizeTranslatable(op.label, defaultLocale)
            }))
          })),
          audienceSpaceIds: d.audienceSpaceIds ?? [],
          audienceGroupIds: d.audienceGroupIds ?? [],
          remindersConfig: d.remindersConfig ?? { offsets: [] },
          notificationsConfig: {
            ...(notifCfg || {}),
            pushPayload,
          },
          requiresApproval: !!d.requiresApproval,
          allowTranslations: !!d.allowTranslations,
          defaultLocale: defaultLocale,
          attachmentsAllowed: attachmentsFlag,
          allowAttachments: attachmentsFlag,
          anonymous: !!d.anonymous,
        }));

        if (d.allowTranslations) {
          const locales = new Set([defaultLocale]);
          Object.keys(normalizeTranslatable(d.title, defaultLocale)).forEach(k => locales.add(k));
          setAvailableLocales(Array.from(locales));
        } else {
          setAvailableLocales([defaultLocale]);
        }

        setSchedStartOn(!!d.scheduleStartAt);
        setSchedEndOn(!!d.scheduleEndAt);
        setDeadlineOn(!!d.deadlineAt);
        setPushOn(!!notifCfg?.push);
        setPushTitleDraft(pushPayload.title);
        setPushBodyDraft(pushPayload.body);
      })
      .catch((e) => setErr(String(e?.message || e)))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [formId, isNew]);

  React.useEffect(() => {
    setSp(prev => {
      const next = new URLSearchParams(prev);
      next.set('step', step);
      return next;
    }, { replace: true });
  }, [step, setSp]);

  const stepIndex = (k: StepKey) => Math.max(0, STEPS.findIndex((s) => s.key === k));
  const nextStepKey = (k: StepKey): StepKey => STEPS[Math.min(STEPS.length - 1, stepIndex(k) + 1)].key as StepKey;
  const goStep = (delta: number) => setStep(STEPS[Math.max(0, Math.min(STEPS.length - 1, stepIndex(step) + delta))].key as StepKey);

  const buildPayload = (base: FormPayload): FormPayload => {
    const attachments = !!base.attachmentsAllowed || !!base.allowAttachments;
    return {
      ...base,
      anonymous: !!base.anonymous,
      allowExternal: !!base.allowExternal,
      allowMultipleSubmissions: !!base.allowMultipleSubmissions,
      attachmentsAllowed: attachments,
      allowAttachments: attachments,
      notificationsConfig: {
        ...(base.notificationsConfig || {}),
        push: !!base.notificationsConfig?.push,
      },
    };
  };

  // 🔥 CORREÇÃO CRÍTICA: Garante que o status enviado seja 'draft' nas etapas intermediárias
  // a não ser que o formulário JÁ ESTEJA publicado no banco.
  const getSafeStatusForIntermediateSave = () => {
    if (isNew) return 'draft';
    if (originalStatus === 'published') return 'published'; // Se já estava live, mantém live
    return 'draft'; // Se era draft, continua draft até o clique final
  };

  const saveDraft = async () => {
    // Força status seguro para não disparar push prematuro
    const safeStatus = getSafeStatusForIntermediateSave();
    // Note: Não mudamos o model.status local, apenas o payload enviado, para não confundir a UI
    const payloadToSend = buildPayload({ ...model, status: safeStatus as any }) as any;

    setSaving(true);
    setErr(null);
    try {
      if (isNew) {
        const created = await FormsApi.create(payloadToSend);
        // Atualiza originalStatus para o que foi criado (provavelmente draft)
        setOriginalStatus(created.status);
        nav(`/forms/${created.id}/edit?step=${step}`, { replace: true });
      } else {
        await FormsApi.update(formId!, payloadToSend);
      }
    } catch (e: any) { setErr(String(e?.message || e)); } finally { setSaving(false); }
  };

  const saveAndNext = async () => {
    // Força status seguro
    const safeStatus = getSafeStatusForIntermediateSave();
    const payloadToSend = buildPayload({ ...model, status: safeStatus as any }) as any;

    setSaving(true);
    setErr(null);
    try {
      if (isNew) {
        const created = await FormsApi.create(payloadToSend);
        setOriginalStatus(created.status);
        nav(`/forms/${created.id}/edit?step=${nextStepKey(step)}`, { replace: true });
      } else {
        await FormsApi.update(formId!, payloadToSend);
        goStep(1);
      }
    } catch (e: any) { setErr(String(e?.message || e)); } finally { setSaving(false); }
  };

  // 🔥 AÇÃO DE PUBLICAR FINAL: Aqui sim enviamos 'published'
  const publish = async () => {
    const payloadToSend = buildPayload({ ...model, status: 'published' }) as any;
    // Atualizamos o model local também
    setModel((m) => ({ ...m, status: 'published' }));

    try {
      await FormsApi.update(formId!, payloadToSend);
      // Atualiza estado local para refletir que agora está live
      setOriginalStatus('published');
      nav('/forms');
    } catch (e: any) { setErr(String(e?.message || e)); }
  };

  const toLocalInputValue = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const fromLocalInputValue = (v: string) => (v ? new Date(v).toISOString() : null);

  const setDeadline18hLocal = () => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    setModel((m) => ({ ...m, deadlineAt: d.toISOString() }));
    setDeadlineOn(true);
  };

  const renderBasics = () => (
    <div className="row g-4">
      <div className="col-12">
        <Form.Group>
          <Form.Label>Título</Form.Label>
          <LanguageTabs locales={availableLocales} values={model.title} onChange={(locale, value) => setModel(m => ({ ...m, title: { ...m.title, [locale]: value } }))} />
        </Form.Group>
      </div>
      <div className="col-12">
        <Form.Group>
          <Form.Label>Descrição</Form.Label>
          <LanguageTabs locales={availableLocales} values={model.description || {}} onChange={(locale, value) => setModel(m => ({ ...m, description: { ...(m.description || {}), [locale]: value } }))} as="textarea" />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <label className="form-label">Status (Intenção)</label>
        <select className="form-select" value={model.status} onChange={(e) => setModel(m => ({ ...m, status: e.target.value as any }))}>
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
        <div className="form-text text-muted small">
          O formulário só será efetivamente publicado ao clicar em "Publicar" na última etapa.
        </div>
      </div>
      <div className="col-md-4 d-flex align-items-end">
        <div className="form-check">
          <input id="anonymous" className="form-check-input" type="checkbox" checked={!!model.anonymous} onChange={(e) => setModel(m => ({ ...m, anonymous: e.target.checked }))} />
          <label className="form-check-label" htmlFor="anonymous">Formulário anônimo</label>
        </div>
      </div>
      <div className="col-md-4 d-flex align-items-end">
        <div className="form-check">
          <input id="allowTranslations" className="form-check-input" type="checkbox" checked={!!model.allowTranslations} onChange={(e) => {
            const on = e.target.checked;
            setModel(m => ({ ...m, allowTranslations: on }));
            if (on) setAvailableLocales(['pt-BR', 'en', 'es-ES']);
            else setAvailableLocales([model.defaultLocale ?? 'pt-BR']);
          }} />
          <label className="form-check-label" htmlFor="allowTranslations">Permitir tradução</label>
        </div>
      </div>
      <div className="col-md-4">
        <label className="form-label">Idioma padrão</label>
        <select className="form-select" value={model.defaultLocale ?? 'pt-BR'} onChange={(e) => setModel(m => ({ ...m, defaultLocale: e.target.value }))}>
          {availableLocales.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>
    </div>
  );

  const renderAudience = () => (
    <AudiencePicker value={{ spaceIds: model.audienceSpaceIds ?? [], groupIds: model.audienceGroupIds ?? [] }} onChange={(val) => setModel(m => ({ ...m, audienceSpaceIds: val.spaceIds, audienceGroupIds: val.groupIds }))} />
  );

  const renderSettings = () => (
    <div className="row g-4">
      <div className="col-12">
        <div className="form-check form-switch">
          <input id="schedStart" className="form-check-input" type="checkbox" checked={schedStartOn} onChange={(e) => { setSchedStartOn(e.target.checked); setModel(m => ({ ...m, scheduleStartAt: e.target.checked ? m.scheduleStartAt ?? new Date().toISOString() : null })) }} />
          <label className="form-check-label" htmlFor="schedStart">Agendar início</label>
        </div>
      </div>
      {schedStartOn && <div className="col-md-6"><label className="form-label">Início</label><input type="datetime-local" className="form-control" value={toLocalInputValue(model.scheduleStartAt)} onChange={(e) => setModel(m => ({ ...m, scheduleStartAt: fromLocalInputValue(e.target.value) }))} /></div>}

      <div className="col-12">
        <div className="form-check form-switch">
          <input id="schedEnd" className="form-check-input" type="checkbox" checked={schedEndOn} onChange={(e) => { setSchedEndOn(e.target.checked); setModel(m => ({ ...m, scheduleEndAt: e.target.checked ? m.scheduleEndAt ?? new Date(Date.now() + 86400000).toISOString() : null })) }} />
          <label className="form-check-label" htmlFor="schedEnd">Agendar expiração</label>
        </div>
      </div>
      {schedEndOn && <div className="col-md-6"><label className="form-label">Expira</label><input type="datetime-local" className="form-control" value={toLocalInputValue(model.scheduleEndAt)} onChange={(e) => setModel(m => ({ ...m, scheduleEndAt: fromLocalInputValue(e.target.value) }))} /></div>}

      <div className="col-12">
        <div className="form-check form-switch">
          <input id="deadlineOn" className="form-check-input" type="checkbox" checked={deadlineOn} onChange={(e) => { const on = e.target.checked; setDeadlineOn(on); setModel(m => ({ ...m, deadlineAt: on ? m.deadlineAt ?? new Date().toISOString() : null })); }} />
          <label className="form-check-label" htmlFor="deadlineOn">Exigir resposta até data</label>
        </div>
      </div>
      {deadlineOn && (
        <>
          <div className="col-md-6"><label className="form-label">Data limite</label><div className="d-flex gap-2"><input type="datetime-local" className="form-control" value={toLocalInputValue(model.deadlineAt)} onChange={(e) => setModel(m => ({ ...m, deadlineAt: fromLocalInputValue(e.target.value) }))} /><button type="button" className="btn btn-light" onClick={setDeadline18hLocal}>18h</button></div></div>
          <div className="col-md-6">
            <label className="form-label">Lembretes</label>
            <div className="d-flex flex-wrap gap-3">
              {[{ k: '-P1D', label: '1 dia antes' }, { k: '-P2D', label: '2 dias antes' }, { k: '-P7D', label: '1 semana antes' }, { k: '-P15D', label: '15 dias antes' }].map((opt) => (
                <div key={opt.k} className="form-check"><input id={`rem-${opt.k}`} className="form-check-input" type="checkbox" checked={(model.remindersConfig?.offsets ?? []).includes(opt.k)} onChange={(e) => { const offsets = new Set(model.remindersConfig?.offsets ?? []); if (e.target.checked) offsets.add(opt.k); else offsets.delete(opt.k); setModel(m => ({ ...m, remindersConfig: { ...(m.remindersConfig ?? {}), offsets: Array.from(offsets) } })); }} /><label className="form-check-label" htmlFor={`rem-${opt.k}`}>{opt.label}</label></div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="col-md-4">
        <div className="form-check mt-2">
          <input id="allowMult" className="form-check-input" type="checkbox" checked={!!model.allowMultipleSubmissions} onChange={(e) => setModel(m => ({ ...m, allowMultipleSubmissions: e.target.checked }))} />
          <label className="form-check-label" htmlFor="allowMult">Múltiplas submissões</label>
        </div>
      </div>

      <div className="col-md-4">
        <div className="form-check mt-2">
          <input id="allowExt" className="form-check-input" type="checkbox" checked={!!model.allowExternal} onChange={(e) => setModel(m => ({ ...m, allowExternal: e.target.checked }))} />
          <label className="form-check-label" htmlFor="allowExt">Permitir externos</label>
        </div>
      </div>

      <div className="col-md-4">
        <div className="form-check form-switch mt-2 d-flex align-items-center gap-2">
          <input id="pushOn" className="form-check-input" type="checkbox" checked={pushOn} onChange={(e) => { const on = e.target.checked; setPushOn(on); if (on) setShowPushModal(true); else setModel(m => ({ ...m, notificationsConfig: { ...m.notificationsConfig, push: false } })); }} />
          <label className="form-check-label" htmlFor="pushOn">Push na publicação</label>
          {pushOn && <button type="button" className="btn btn-link btn-sm" onClick={() => setShowPushModal(true)}>editar</button>}
        </div>
      </div>

      <div className="col-md-6">
        <div className="form-check mt-3">
          <input id="attachments" className="form-check-input" type="checkbox" checked={!!model.attachmentsAllowed} onChange={(e) => setModel(m => ({ ...m, attachmentsAllowed: e.target.checked }))} />
          <label className="form-check-label" htmlFor="attachments">Permitir anexos</label>
        </div>
      </div>
      <div className="col-md-6">
        <Form.Group>
          <Form.Label>Ajuda para anexos</Form.Label>
          <LanguageTabs locales={availableLocales} values={model.attachmentHelpText || {}} onChange={(locale, value) => setModel(m => ({ ...m, attachmentHelpText: { ...(m.attachmentHelpText || {}), [locale]: value } }))} />
        </Form.Group>
      </div>

      <div className="col-12">
        <div className="form-check mt-2">
          <input id="requiresApproval" className="form-check-input" type="checkbox" checked={!!model.requiresApproval} onChange={(e) => setModel(m => ({ ...m, requiresApproval: e.target.checked }))} />
          <label className="form-check-label" htmlFor="requiresApproval">Para aprovação do RH?</label>
        </div>
      </div>

      <div className="col-12">
        {!isNew && <button type="button" className="btn btn-light" onClick={() => setShowEmailModal(true)}>Configurar e-mails de alerta</button>}
      </div>
    </div>
  );

  const renderFields = () => (
    <FieldEditor fields={model.fields ?? []} onChange={(fields) => setModel(m => ({ ...m, fields }))} locales={availableLocales} />
  );

  const renderReview = () => {
    const attachments = !!model.attachmentsAllowed || !!model.allowAttachments;
    const notif = model.notificationsConfig ?? {};
    const defaultLocale = model.defaultLocale || 'pt-BR';
    const isDraftMode = (originalStatus === 'draft');

    return (
      <div className="p-3 space-y-4">
        <h5 className="mb-3">Resumo</h5>

        {model.status === 'published' && isDraftMode && (
          <div className="alert alert-success">
            <strong>Atenção:</strong> O formulário será <strong>PUBLICADO</strong> ao clicar no botão abaixo e o Push Notification será enviado.
          </div>
        )}

        <div className="mb-3">
          <h6>Informações básicas</h6>
          <ul className="list-unstyled mb-0">
            <li><strong>Título:</strong> {model.title[defaultLocale] || <em>(sem título)</em>}</li>
            <li><strong>Status Atual:</strong> {originalStatus}</li>
            <li><strong>Status Alvo:</strong> {model.status}</li>
            <li><strong>Idioma padrão:</strong> {model.defaultLocale ?? '-'}</li>
            <li><strong>Permitir tradução:</strong> {model.allowTranslations ? 'Sim' : 'Não'}</li>
          </ul>
        </div>
        <div className="mb-3">
          <h6>Configurações</h6>
          <ul className="list-unstyled mb-0">
            <li><strong>Push na publicação:</strong> {notif.push ? 'Sim' : 'Não'}</li>
            <li><strong>Para aprovação do RH:</strong> {model.requiresApproval ? 'Sim' : 'Não'}</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="container-xxl">
        <div className="card">
          <div className="card-header align-items-center justify-content-between">
            <h3 className="card-title">{isNew ? 'Criar formulário' : 'Editar formulário'}</h3>
            <div className="d-flex gap-2">
              <button className="btn btn-light" onClick={() => nav('/forms')} disabled={saving}>Cancelar</button>
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
                  <button type="button" className="btn btn-success" onClick={publish} disabled={saving}>
                    {model.status === 'published' ? 'Publicar Agora' : 'Salvar Final'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="card-body">
            {err && <div className="alert alert-danger mb-4">{err}</div>}
            {loading ? <div>Carregando…</div> : (
              <>
                <StepHeader steps={STEPS.map(s => ({ key: s.key, title: s.title }))} currentKey={step} onStepClick={(k) => setStep(k as StepKey)} />
                {step === 'basics' && renderBasics()}
                {step === 'audience' && renderAudience()}
                {step === 'settings' && renderSettings()}
                {step === 'fields' && renderFields()}
                {step === 'review' && renderReview()}
              </>
            )}
          </div>
          <div className="card-footer d-flex justify-content-between">
            <button className="btn btn-light" onClick={() => goStep(-1)} disabled={STEPS.findIndex((s) => s.key === step) === 0}>Voltar</button>
          </div>
        </div>
      </div>
      {!isNew && <FormEmailSettingsModal show={showEmailModal} onHide={() => setShowEmailModal(false)} formId={formId!} />}

      <Modal show={showPushModal} onHide={() => setShowPushModal(false)}>
        <Modal.Header closeButton><Modal.Title>Push da publicação</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Título</Form.Label>
            <LanguageTabs locales={availableLocales} values={pushTitleDraft} onChange={(l, v) => setPushTitleDraft(p => ({ ...p, [l]: v }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Mensagem</Form.Label>
            <LanguageTabs locales={availableLocales} values={pushBodyDraft} onChange={(l, v) => setPushBodyDraft(p => ({ ...p, [l]: v }))} as="textarea" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPushModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={() => {
            setModel(m => ({ ...m, notificationsConfig: { ...m.notificationsConfig, push: true, pushPayload: { title: pushTitleDraft, body: pushBodyDraft } } }));
            setShowPushModal(false);
          }}>Salvar</Button>
        </Modal.Footer>

      </Modal>
    </>

  );
}