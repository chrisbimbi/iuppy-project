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
import { useIntl } from 'react-intl';
import { useAuth } from '../../auth/core/Auth';

// ... types

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuidV4 = (s?: string) => !!s && uuidV4Regex.test(s);

export default function FormEditPage() {
  const { formId } = useParams<{ formId?: string }>();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const intl = useIntl();
  const { currentUser } = useAuth();
  // Prioritize session companyId (Source of Truth) to avoid stale localStorage issues
  const getEffectiveCompanyId = () => {
    if (currentUser?.companyId) return currentUser.companyId;
    return window.localStorage.getItem('companyId');
  };
  const companyId = getEffectiveCompanyId();

  const STEPS = [
    { key: 'basics', title: intl.formatMessage({ id: 'FORMS.EDIT.STEP.BASICS' }) },
    { key: 'audience', title: intl.formatMessage({ id: 'FORMS.EDIT.STEP.AUDIENCE' }) },
    { key: 'settings', title: intl.formatMessage({ id: 'FORMS.EDIT.STEP.SETTINGS' }) },
    { key: 'fields', title: intl.formatMessage({ id: 'FORMS.EDIT.STEP.FIELDS' }) },
    { key: 'review', title: intl.formatMessage({ id: 'FORMS.EDIT.STEP.REVIEW' }) },
  ] as const;
  type StepKey = (typeof STEPS)[number]['key'];

  const isNew = !formId || formId === 'new' || !isUuidV4(formId);
  const stepFromUrl = (sp.get('step') as StepKey) || 'basics';
  const [step, setStep] = React.useState<StepKey>(stepFromUrl);

  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [model, setModel] = React.useState<any>({
    title: {},
    description: {},
    status: 'draft',
    fields: [],
    allowTranslations: false,
    defaultLocale: 'pt-BR',
  });
  const [originalStatus, setOriginalStatus] = React.useState<string>('draft');
  const [availableLocales, setAvailableLocales] = React.useState<string[]>(['pt-BR']);

  const [showEmailModal, setShowEmailModal] = React.useState(false);
  const [showPushModal, setShowPushModal] = React.useState(false);

  const [schedStartOn, setSchedStartOn] = React.useState(false);
  const [schedEndOn, setSchedEndOn] = React.useState(false);
  const [deadlineOn, setDeadlineOn] = React.useState(false);
  const [pushOn, setPushOn] = React.useState(false);

  const [pushTitleDraft, setPushTitleDraft] = React.useState<TranslatableString>({});
  const [pushBodyDraft, setPushBodyDraft] = React.useState<TranslatableString>({});

  const toLocalInputValue = (isoStr?: string | null) => {
    if (!isoStr) return '';
    return isoStr.substring(0, 16);
  };

  const fromLocalInputValue = (val: string) => {
    if (!val) return null;
    return new Date(val).toISOString();
  };

  const setDeadline18hLocal = () => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    setModel((m: any) => ({ ...m, deadlineAt: d.toISOString() }));
  };

  const load = async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await FormsApi.get(formId!, companyId || undefined);
      setModel(data);
      setOriginalStatus(data.status);
      setAvailableLocales(data.allowTranslations ? ['pt-BR', 'en', 'es-ES'] : [data.defaultLocale || 'pt-BR']);

      if (data.scheduleStartAt) setSchedStartOn(true);
      if (data.scheduleEndAt) setSchedEndOn(true);
      if (data.deadlineAt) setDeadlineOn(true);
      if (data.notificationsConfig?.push) setPushOn(true);

    } catch (e: any) {
      setErr(e.message || intl.formatMessage({ id: 'FORMS.EDIT.ERROR.LOAD_FAILED' }));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    load();
  }, [formId]);

  const save = async (nextStep?: StepKey) => {
    setSaving(true);
    setErr(null);
    try {
      let res;
      if (isNew) {
        res = await FormsApi.create({ ...model, companyId: companyId || 'current' });
      } else {
        res = await FormsApi.update(formId!, model, companyId!);
      }

      if (isNew) {
        // Backend returns the form entity with 'id', not 'formId'
        nav(`/forms/${res.id}/edit?step=${nextStep || 'basics'}`, { replace: true });
      } else {
        setModel(res);
        if (nextStep) setStep(nextStep);
      }
    } catch (e: any) {
      setErr(e.message || intl.formatMessage({ id: 'FORMS.EDIT.ERROR.SAVE_FAILED' }));
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = () => save();
  const saveAndNext = () => {
    const idx = STEPS.findIndex(s => s.key === step);
    if (idx < STEPS.length - 1) save(STEPS[idx + 1].key);
    else save();
  };

  const goStep = (delta: number) => {
    const idx = STEPS.findIndex(s => s.key === step);
    const nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < STEPS.length) setStep(STEPS[nextIdx].key);
  };

  const publish = async () => {
    if (!confirm(intl.formatMessage({ id: 'FORMS.EDIT.CONFIRM.PUBLISH' }))) return;
    setSaving(true);
    try {
      await FormsApi.publish(formId!, companyId!);
      await load();
      nav('/forms');
    } catch (e: any) {
      setErr(e.message || intl.formatMessage({ id: 'FORMS.EDIT.ERROR.PUBLISH_FAILED' }));
      setSaving(false);
    }
  };

  const renderBasics = () => (
    <div className="row g-4">
      <div className="col-12">
        <Form.Group>
          <Form.Label>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.TITLE' })}</Form.Label>
          <LanguageTabs locales={availableLocales} values={model.title} onChange={(locale, value) => setModel((m: any) => ({ ...m, title: { ...m.title, [locale]: value } }))} />
        </Form.Group>
      </div>
      <div className="col-12">
        <Form.Group>
          <Form.Label>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.DESCRIPTION' })}</Form.Label>
          <LanguageTabs locales={availableLocales} values={model.description || {}} onChange={(locale, value) => setModel((m: any) => ({ ...m, description: { ...(m.description || {}), [locale]: value } }))} as="textarea" />
        </Form.Group>
      </div>
      <div className="col-md-4">
        <label className="form-label">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.STATUS' })}</label>
        <select className="form-select" value={model.status} onChange={(e) => setModel((m: any) => ({ ...m, status: e.target.value as any }))}>
          <option value="draft">{intl.formatMessage({ id: 'FORMS.EDIT.STATUS.DRAFT' })}</option>
          <option value="published">{intl.formatMessage({ id: 'FORMS.EDIT.STATUS.PUBLISHED' })}</option>
          <option value="archived">{intl.formatMessage({ id: 'FORMS.EDIT.STATUS.ARCHIVED' })}</option>
        </select>
        <div className="form-text text-muted small">
          {intl.formatMessage({ id: 'FORMS.EDIT.INFO.PUBLISH_NOTE' })}
        </div>
      </div>
      <div className="col-md-4">
        <label className="form-label">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.VISIBILITY', defaultMessage: 'Visibilidade' })}</label>
        <select className="form-select" value={model.visibility ?? 'public'} onChange={(e) => setModel((m: any) => ({ ...m, visibility: e.target.value }))}>
          <option value="public">{intl.formatMessage({ id: 'FORMS.EDIT.OPTION.PUBLIC', defaultMessage: 'Público' })}</option>
          <option value="private">{intl.formatMessage({ id: 'FORMS.EDIT.OPTION.PRIVATE', defaultMessage: 'Privado' })}</option>
          <option value="specific_groups">{intl.formatMessage({ id: 'FORMS.EDIT.OPTION.GROUPS', defaultMessage: 'Grupos Específicos' })}</option>
          <option value="journey_only">{intl.formatMessage({ id: 'FORMS.EDIT.OPTION.JOURNEY_ONLY', defaultMessage: 'Apenas Jornadas' })}</option>
        </select>
      </div>
      <div className="col-md-4 d-flex align-items-end">
        <div className="form-check">
          <input id="anonymous" className="form-check-input" type="checkbox" checked={!!model.anonymous} onChange={(e) => setModel((m: any) => ({ ...m, anonymous: e.target.checked }))} />
          <label className="form-check-label" htmlFor="anonymous">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.ANONYMOUS' })}</label>
        </div>
      </div>
      <div className="col-md-4 d-flex align-items-end">
        <div className="form-check">
          <input id="allowTranslations" className="form-check-input" type="checkbox" checked={!!model.allowTranslations} onChange={(e) => {
            const on = e.target.checked;
            setModel((m: any) => ({ ...m, allowTranslations: on }));
            if (on) setAvailableLocales(['pt-BR', 'en', 'es-ES']);
            else setAvailableLocales([model.defaultLocale ?? 'pt-BR']);
          }} />
          <label className="form-check-label" htmlFor="allowTranslations">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.ALLOW_TRANSLATION' })}</label>
        </div>
      </div>
      <div className="col-md-4">
        <label className="form-label">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.DEFAULT_LOCALE' })}</label>
        <select className="form-select" value={model.defaultLocale ?? 'pt-BR'} onChange={(e) => setModel((m: any) => ({ ...m, defaultLocale: e.target.value }))}>
          {availableLocales.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
      </div>
    </div>
  );

  const renderAudience = () => (
    <AudiencePicker value={{ spaceIds: model.audienceSpaceIds ?? [], groupIds: model.audienceGroupIds ?? [] }} onChange={(val) => setModel((m: any) => ({ ...m, audienceSpaceIds: val.spaceIds, audienceGroupIds: val.groupIds }))} />
  );

  const renderSettings = () => (
    <div className="row g-4">
      <div className="col-12">
        <div className="form-check form-switch">
          <input id="schedStart" className="form-check-input" type="checkbox" checked={schedStartOn} onChange={(e) => { setSchedStartOn(e.target.checked); setModel((m: any) => ({ ...m, scheduleStartAt: e.target.checked ? m.scheduleStartAt ?? new Date().toISOString() : null })) }} />
          <label className="form-check-label" htmlFor="schedStart">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.SCHEDULE_START' })}</label>
        </div>
      </div>
      {schedStartOn && <div className="col-md-6"><label className="form-label">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.START_DATE' })}</label><input type="datetime-local" className="form-control" value={toLocalInputValue(model.scheduleStartAt)} onChange={(e) => setModel((m: any) => ({ ...m, scheduleStartAt: fromLocalInputValue(e.target.value) }))} /></div>}

      <div className="col-12">
        <div className="form-check form-switch">
          <input id="schedEnd" className="form-check-input" type="checkbox" checked={schedEndOn} onChange={(e) => { setSchedEndOn(e.target.checked); setModel((m: any) => ({ ...m, scheduleEndAt: e.target.checked ? m.scheduleEndAt ?? new Date(Date.now() + 86400000).toISOString() : null })) }} />
          <label className="form-check-label" htmlFor="schedEnd">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.SCHEDULE_END' })}</label>
        </div>
      </div>
      {schedEndOn && <div className="col-md-6"><label className="form-label">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.END_DATE' })}</label><input type="datetime-local" className="form-control" value={toLocalInputValue(model.scheduleEndAt)} onChange={(e) => setModel((m: any) => ({ ...m, scheduleEndAt: fromLocalInputValue(e.target.value) }))} /></div>}

      <div className="col-12">
        <div className="form-check form-switch">
          <input id="deadlineOn" className="form-check-input" type="checkbox" checked={deadlineOn} onChange={(e) => { const on = e.target.checked; setDeadlineOn(on); setModel((m: any) => ({ ...m, deadlineAt: on ? m.deadlineAt ?? new Date().toISOString() : null })); }} />
          <label className="form-check-label" htmlFor="deadlineOn">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.DEADLINE_TOGGLE' })}</label>
        </div>
      </div>
      {deadlineOn && (
        <>
          <div className="col-md-6"><label className="form-label">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.DEADLINE_DATE' })}</label><div className="d-flex gap-2"><input type="datetime-local" className="form-control" value={toLocalInputValue(model.deadlineAt)} onChange={(e) => setModel((m: any) => ({ ...m, deadlineAt: fromLocalInputValue(e.target.value) }))} /><button type="button" className="btn btn-light" onClick={setDeadline18hLocal}>18h</button></div></div>
          <div className="col-md-6">
            <label className="form-label">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.REMINDERS' })}</label>
            <div className="d-flex flex-wrap gap-3">
              {[{ k: '-P1D', label: intl.formatMessage({ id: 'FORMS.EDIT.REMINDER.1_DAY' }) }, { k: '-P2D', label: intl.formatMessage({ id: 'FORMS.EDIT.REMINDER.2_DAYS' }) }, { k: '-P7D', label: intl.formatMessage({ id: 'FORMS.EDIT.REMINDER.1_WEEK' }) }, { k: '-P15D', label: intl.formatMessage({ id: 'FORMS.EDIT.REMINDER.15_DAYS' }) }].map((opt) => (
                <div key={opt.k} className="form-check"><input id={`rem-${opt.k}`} className="form-check-input" type="checkbox" checked={(model.remindersConfig?.offsets ?? []).includes(opt.k)} onChange={(e) => { const offsets = new Set(model.remindersConfig?.offsets ?? []); if (e.target.checked) offsets.add(opt.k); else offsets.delete(opt.k); setModel((m: any) => ({ ...m, remindersConfig: { ...(m.remindersConfig ?? {}), offsets: Array.from(offsets) } })); }} /><label className="form-check-label" htmlFor={`rem-${opt.k}`}>{opt.label}</label></div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="col-md-4">
        <div className="form-check mt-2">
          <input id="allowMult" className="form-check-input" type="checkbox" checked={!!model.allowMultipleSubmissions} onChange={(e) => setModel((m: any) => ({ ...m, allowMultipleSubmissions: e.target.checked }))} />
          <label className="form-check-label" htmlFor="allowMult">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.MULTIPLE_SUBMISSIONS' })}</label>
        </div>
      </div>

      <div className="col-md-4">
        <div className="form-check mt-2">
          <input id="allowExt" className="form-check-input" type="checkbox" checked={!!model.allowExternal} onChange={(e) => setModel((m: any) => ({ ...m, allowExternal: e.target.checked }))} />
          <label className="form-check-label" htmlFor="allowExt">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.ALLOW_EXTERNAL' })}</label>
        </div>
      </div>

      <div className="col-md-4">
        <div className="form-check form-switch mt-2 d-flex align-items-center gap-2">
          <input id="pushOn" className="form-check-input" type="checkbox" checked={pushOn} onChange={(e) => { const on = e.target.checked; setPushOn(on); if (on) setShowPushModal(true); else setModel((m: any) => ({ ...m, notificationsConfig: { ...m.notificationsConfig, push: false } })); }} />
          <label className="form-check-label" htmlFor="pushOn">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.PUSH_ON_PUBLISH' })}</label>
          {pushOn && <button type="button" className="btn btn-link btn-sm" onClick={() => setShowPushModal(true)}>{intl.formatMessage({ id: 'FORMS.EDIT.ACTION.EDIT' })}</button>}
        </div>
      </div>

      <div className="col-md-6">
        <div className="form-check mt-3">
          <input id="attachments" className="form-check-input" type="checkbox" checked={!!model.attachmentsAllowed} onChange={(e) => setModel((m: any) => ({ ...m, attachmentsAllowed: e.target.checked }))} />
          <label className="form-check-label" htmlFor="attachments">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.ALLOW_ATTACHMENTS' })}</label>
        </div>
      </div>
      <div className="col-md-6">
        <Form.Group>
          <Form.Label>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.ATTACHMENT_HELP' })}</Form.Label>
          <LanguageTabs locales={availableLocales} values={model.attachmentHelpText || {}} onChange={(locale, value) => setModel((m: any) => ({ ...m, attachmentHelpText: { ...(m.attachmentHelpText || {}), [locale]: value } }))} />
        </Form.Group>
      </div>

      <div className="col-12">
        <div className="form-check mt-2">
          <input id="requiresApproval" className="form-check-input" type="checkbox" checked={!!model.requiresApproval} onChange={(e) => setModel((m: any) => ({ ...m, requiresApproval: e.target.checked }))} />
          <label className="form-check-label" htmlFor="requiresApproval">{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.REQUIRES_APPROVAL' })}</label>
        </div>
      </div>

      <div className="col-12">
        <div className="form-check mt-2">
          <input id="isNr1" className="form-check-input" type="checkbox" checked={!!model.isNr1} onChange={(e) => setModel((m: any) => ({ ...m, isNr1: e.target.checked }))} />
          <label className="form-check-label" htmlFor="isNr1">
            Conteúdo NR-1
            <span className="form-text text-muted d-block mt-1 fs-8">Marcar este formulário como parte do NR-1 Digital (Hub)</span>
          </label>
        </div>
      </div>



      <div className="col-12">
        {!isNew && <button type="button" className="btn btn-light" onClick={() => setShowEmailModal(true)}>{intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.CONFIGURE_EMAILS' })}</button>}
      </div>
    </div>
  );

  const renderFields = () => (
    <FieldEditor fields={model.fields ?? []} onChange={(fields) => setModel((m: any) => ({ ...m, fields }))} locales={availableLocales} />
  );

  const renderReview = () => {
    const attachments = !!model.attachmentsAllowed || !!model.allowAttachments;
    const notif = model.notificationsConfig ?? {};
    const defaultLocale = model.defaultLocale || 'pt-BR';
    const isDraftMode = (originalStatus === 'draft');

    return (
      <div className="p-3 space-y-4">
        <h5 className="mb-3">{intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.TITLE' })}</h5>

        {model.status === 'published' && isDraftMode && (
          <div className="alert alert-success">
            <strong>{intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.WARNING.TITLE' })}</strong> {intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.WARNING.TEXT_1' })} <strong>{intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.WARNING.TEXT_2' })}</strong> {intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.WARNING.TEXT_3' })}
          </div>
        )}

        <div className="mb-3">
          <h6>{intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.SECTION.BASICS' })}</h6>
          <ul className="list-unstyled mb-0">
            <li><strong>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.TITLE' })}:</strong> {model.title[defaultLocale] || <em>(sem título)</em>}</li>
            <li><strong>{intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.LABEL.CURRENT_STATUS' })}</strong> {originalStatus}</li>
            <li><strong>{intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.LABEL.TARGET_STATUS' })}</strong> {model.status}</li>
            <li><strong>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.DEFAULT_LOCALE' })}:</strong> {model.defaultLocale ?? '-'}</li>
            <li><strong>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.ALLOW_TRANSLATION' })}:</strong> {model.allowTranslations ? intl.formatMessage({ id: 'FORMS.EDIT.YES' }) : intl.formatMessage({ id: 'FORMS.EDIT.NO' })}</li>
          </ul>
        </div>
        <div className="mb-3">
          <h6>{intl.formatMessage({ id: 'FORMS.EDIT.REVIEW.SECTION.SETTINGS' })}</h6>
          <ul className="list-unstyled mb-0">
            <li><strong>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.PUSH_ON_PUBLISH' })}:</strong> {notif.push ? intl.formatMessage({ id: 'FORMS.EDIT.YES' }) : intl.formatMessage({ id: 'FORMS.EDIT.NO' })}</li>
            <li><strong>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.REQUIRES_APPROVAL' })}:</strong> {model.requiresApproval ? intl.formatMessage({ id: 'FORMS.EDIT.YES' }) : intl.formatMessage({ id: 'FORMS.EDIT.NO' })}</li>
            <li><strong>Conteúdo NR-1:</strong> {model.isNr1 ? intl.formatMessage({ id: 'FORMS.EDIT.YES' }) : intl.formatMessage({ id: 'FORMS.EDIT.NO' })}</li>
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
            <h3 className="card-title">{isNew ? intl.formatMessage({ id: 'FORMS.EDIT.TITLE.CREATE' }) : intl.formatMessage({ id: 'FORMS.EDIT.TITLE.EDIT' })}</h3>
            <div className="d-flex gap-2">
              <button className="btn btn-light" onClick={() => nav('/forms')} disabled={saving}>{intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.CANCEL' })}</button>
              {step !== 'review' ? (
                <>
                  <button type="button" className="btn btn-light" onClick={saveDraft} disabled={saving}>
                    {saving ? intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVING' }) : intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVE_DRAFT' })}
                  </button>
                  <button type="button" className="btn btn-primary" onClick={saveAndNext} disabled={saving}>
                    {saving ? intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVING' }) : intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVE_NEXT' })}
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-light" onClick={saveDraft} disabled={saving}>
                    {saving ? intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVING' }) : intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVE_DRAFT' })}
                  </button>
                  <button type="button" className="btn btn-success" onClick={publish} disabled={saving}>
                    {model.status === 'published' ? intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.PUBLISH_NOW' }) : intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVE_FINAL' })}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="card-body">
            {err && <div className="alert alert-danger mb-4">{err}</div>}
            {loading ? <div>{intl.formatMessage({ id: 'FORMS.EDIT.LOADING' })}</div> : (
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
            <button className="btn btn-light" onClick={() => goStep(-1)} disabled={STEPS.findIndex((s) => s.key === step) === 0}>{intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.BACK' })}</button>
          </div>
        </div>
      </div>
      {!isNew && <FormEmailSettingsModal show={showEmailModal} onHide={() => setShowEmailModal(false)} formId={formId!} />}

      <Modal show={showPushModal} onHide={() => setShowPushModal(false)}>
        <Modal.Header closeButton><Modal.Title>{intl.formatMessage({ id: 'FORMS.EDIT.MODAL.PUSH.TITLE' })}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>{intl.formatMessage({ id: 'FORMS.EDIT.LABEL.TITLE' })}</Form.Label>
            <LanguageTabs locales={availableLocales} values={pushTitleDraft} onChange={(l, v) => setPushTitleDraft(p => ({ ...p, [l]: v }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>{intl.formatMessage({ id: 'FORMS.EDIT.MODAL.PUSH.MESSAGE' })}</Form.Label>
            <LanguageTabs locales={availableLocales} values={pushBodyDraft} onChange={(l, v) => setPushBodyDraft(p => ({ ...p, [l]: v }))} as="textarea" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPushModal(false)}>{intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.CANCEL' })}</Button>
          <Button variant="primary" onClick={() => {
            setModel((m: any) => ({ ...m, notificationsConfig: { ...m.notificationsConfig, push: true, pushPayload: { title: pushTitleDraft, body: pushBodyDraft } } }));
            setShowPushModal(false);
          }}>{intl.formatMessage({ id: 'FORMS.EDIT.BUTTON.SAVE' })}</Button>
        </Modal.Footer>

      </Modal>
    </>

  );
}