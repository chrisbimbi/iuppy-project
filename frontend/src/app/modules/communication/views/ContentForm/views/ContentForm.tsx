import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Formik, Form, FormikHelpers } from 'formik';
import { useIntl } from 'react-intl';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import { KTSVG } from 'src/helpers';
import { PageTitle } from 'src/layout/core';
import { Content } from 'src/layout/components/Content';
import { api } from 'src/app/api'

import {
  CreateNewsDto as CreateContentDto,
  UpdateNewsDto as UpdateContentDto,
} from '@shared/types';
import { useAuth } from 'src/app/modules/auth';
import { useContentActions } from '../../../providers/useContentActions';
import { uploadArrayOfFiles } from 'src/utils/fileUtils';
import { AudienceMode } from '@shared/types/NewsSettings';

import { NewsAudienceService } from '../../../services/news-audience.service';
import { createNewSchema } from '../helpers/validationSchemas';

interface ContentFormProps {
  initialValues: CreateContentDto;
  editingId?: string;
  contextSpaceId?: string | null;      // ⬅ novo
  contextChannelId?: string | null;    // ⬅ novo
  onSaved: () => void;
}

type LocalFileLike = { name: string; url: string; file?: File };

async function uploadAllAssets(
  companyId: string,
  authorId: string,
  highlightImages: LocalFileLike[] = [],
  attachments: LocalFileLike[] = [],
  onProgress?: (fraction01: number) => void
): Promise<{
  highlightImages: Array<{ name: string; url: string }>;
  attachments: Array<{ name: string; url: string }>;
}> {
  const hiToUpload = (highlightImages || []).filter(i => i.file).length;
  const atToUpload = (attachments || []).filter(i => i.file).length;
  const total = hiToUpload + atToUpload;

  const emit = (n: number) => onProgress?.(Math.max(0, Math.min(1, n)));

  if (total === 0) {
    emit(1);
    const hi = await uploadArrayOfFiles(highlightImages || [], companyId, 'highlight');
    const at = await uploadArrayOfFiles(attachments || [], companyId, 'attachment');
    return { highlightImages: hi, attachments: at };
  }

  let uploadedHighlight: Array<{ name: string; url: string }> = [];
  if (hiToUpload > 0) {
    uploadedHighlight = await uploadArrayOfFiles(
      highlightImages || [],
      companyId,
      'highlight',
      (p) => {
        const part = (hiToUpload / total) * (p.percent / 100);
        emit(part);
      }
    );
  } else {
    uploadedHighlight = await uploadArrayOfFiles(highlightImages || [], companyId, 'highlight');
    emit(hiToUpload / total);
  }

  let uploadedAttachments: Array<{ name: string; url: string }> = [];
  if (atToUpload > 0) {
    uploadedAttachments = await uploadArrayOfFiles(
      attachments || [],
      companyId,
      'attachment',
      (p) => {
        const base = hiToUpload / total;
        const part = (atToUpload / total) * (p.percent / 100);
        emit(base + part);
      }
    );
  } else {
    uploadedAttachments = await uploadArrayOfFiles(attachments || [], companyId, 'attachment');
    emit(1);
  }

  emit(1);
  return { highlightImages: uploadedHighlight, attachments: uploadedAttachments };
}

/** Normaliza settings apenas para coerência visual/legado. */
function normalizeSettingsForLegacy(input: any) {
  const {
    audienceMode,
    audienceGroupIds,
    ...rest
  } = input || {}

  const out: any = { ...rest }

  if (audienceMode === AudienceMode.GROUPS) {
    out.visibility = 'specific_groups'
    out.targetAudience = Array.isArray(audienceGroupIds) ? audienceGroupIds : []
  } else {
    out.targetAudience = []
    if (out.visibility === 'specific_groups') out.visibility = 'public'
  }
  return out
}

const ContentForm: React.FC<ContentFormProps> = ({
  initialValues,
  editingId,
  contextSpaceId,        // ⬅ novo
  contextChannelId,      // ⬅ novo
  onSaved,
}) => {
  const intl = useIntl();
  const { currentUser } = useAuth();
  const [values, setValues] = useState<CreateContentDto>(initialValues);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | boolean>(false);

  const [stage, setStage] = useState<'idle' | 'upload' | 'save'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  const { createItem, editItem } = useContentActions(onSaved);

  useEffect(() => {
    if (currentUser) {
      setValues(v => ({
        ...v,
        authorId: String(currentUser.id),
        companyId: currentUser.companyId,
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    const base = { ...initialValues };
    if (currentUser) {
      base.authorId = String(currentUser.id);
      base.companyId = currentUser.companyId;
    }

    // 🔧 FIX: Garantir que settings sempre tenha TODOS os campos obrigatórios
    const defaultSettings = {
      visibility: 'public',
      allowComments: true,
      moderateComments: false,
      allowReactions: true,
      notifyUsers: false,
      pushNotification: false,
      inAppNotification: false,
      emailNotification: false,
      acknowledgementRequired: false,
      restrictAccess: false,
      allowSharing: true,
      showAuthor: true,
      showPublishDate: true,
      pinToTop: false,
      schedulePublication: false,
      expirePublication: false,
      targetAudience: [],
    };
    base.settings = Object.assign({}, defaultSettings, base.settings || {});

    // 🩹 FIX: Reconstruir audienceMode se não vier do backend
    if (base.settings && !base.settings.audienceMode) {
      if (base.settings.visibility === 'specific_groups') {
        base.settings.audienceMode = AudienceMode.GROUPS;
        // Garante que targetAudience esteja populado se houver audienceGroupIds (legado)
        if (!base.settings.targetAudience && base.settings.audienceGroupIds) {
          base.settings.targetAudience = base.settings.audienceGroupIds;
        }
      } else if (base.channelId && base.settings.visibility === 'public') {
        // Se for público e tiver canal, assumimos CHANNEL ou COMPANY.
        // O padrão seguro é COMPANY, mas se o usuário selecionar CHANNEL no step2, muda.
        // Se quisermos ser precisos, precisaríamos checar se o canal é "global" ou não.
        // Por enquanto, COMPANY é o default do Step2, então ok.
        base.settings.audienceMode = AudienceMode.COMPANY;
      }
    }

    setValues(base);
    setStep(1);
  }, [initialValues, currentUser]);

  const next = () => setStep(s => Math.min(s + 1, 2));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  const handleChange = (field: string, val: any) => {
    setValues(v => {
      if (field.startsWith('settings.')) {
        const key = field.split('.')[1];
        return { ...v, settings: { ...v.settings, [key]: val } };
      }
      // @ts-ignore
      return { ...v, [field]: val };
    });
  };

  const buildAudienceSelection = (dto: CreateContentDto) => {
    const mode: AudienceMode | undefined = dto.settings?.audienceMode
    if (!mode) return null

    if (mode === AudienceMode.GROUPS) {
      return {
        mode,
        groupIds: dto.settings?.audienceGroupIds || dto.settings?.targetAudience || []
      }
    }

    // Para SPACE / CHANNEL vamos deixar o backend derivar do newsId
    return { mode }
  }

  const applyAudienceIfAny = async (newsId: string, dto: CreateContentDto) => {
    const selection = buildAudienceSelection(dto)
    if (!selection) return
    try {
      await NewsAudienceService.applyAudience(newsId, selection as any)
    } catch (e) {
      console.warn('[audience.apply] falha ao aplicar audiência', e)
    }
  }

  const maybePush = async (newsId: string, dto: CreateContentDto) => {
    const shouldPush =
      (dto?.settings?.pushNotification === true) &&
      (dto?.isPublished === true)

    if (!shouldPush) return
    try {
      await api.post(`/v2/news/${newsId}/push`, { onlyNotOpened: false })
    } catch (err) {
      console.warn('[push] falha ao disparar', err)
    }
  }

  const [showPushConfirm, setShowPushConfirm] = useState(false);
  const [pendingDto, setPendingDto] = useState<CreateContentDto | null>(null);
  const [pendingHelpers, setPendingHelpers] = useState<FormikHelpers<CreateContentDto> | null>(null);

  const handlePushConfirm = async (shouldSend: boolean) => {
    setShowPushConfirm(false);
    if (!pendingDto || !pendingHelpers) return;

    const finalDto = { ...pendingDto };
    if (!shouldSend) {
      // Se não quiser reenviar, desativa o push no settings
      if (finalDto.settings) {
        finalDto.settings.pushNotification = false;
      }
    }
    await processSubmit(finalDto, pendingHelpers);
  };

  const processSubmit = async (
    dto: CreateContentDto,
    helpers: FormikHelpers<CreateContentDto>
  ) => {
    try {
      setErr(false);

      setStage('upload');
      setUploadProgress(0);

      const uploaded = await uploadAllAssets(
        dto.companyId!, dto.authorId!,
        (dto.highlightImages as unknown as LocalFileLike[]) || [],
        (dto.attachments as unknown as LocalFileLike[]) || [],
        (fraction) => setUploadProgress(fraction)
      );

      // Apenas coerência visual/legado:
      const normalizedSettings = normalizeSettingsForLegacy(dto.settings || {})

      setStage('save');

      const updateDto: UpdateContentDto = {
        title: dto.title,
        subtitle: dto.subtitle,
        content: dto.content,
        hashtags: dto.hashtags,
        channelId: dto.channelId,
        authorId: dto.authorId!,
        companyId: dto.companyId!,
        isPublished: dto.isPublished,
        attachments: uploaded.attachments,
        highlightImages: uploaded.highlightImages.map(i => ({
          name: i.name,
          url: i.url,
          altText: i.name,
        })),
        // ⚠️ enviar somente campos aceitos pelo backend
        settings: { ...normalizedSettings },
      };

      if (editingId) {
        const updated = await editItem(editingId, updateDto)

        await applyAudienceIfAny(editingId, dto)
        await maybePush(editingId, dto)

      } else {
        const created = await createItem({
          ...dto,
          settings: { ...normalizedSettings },
          attachments: uploaded.attachments,
          highlightImages: uploaded.highlightImages as any,
        } as any)

        if (created?.id) {
          await applyAudienceIfAny(created.id, dto)
          await maybePush(created.id, dto)
        }
      }
    } catch (error: any) {
      console.error('❌ [ContentForm] Erro ao salvar conteúdo:', error);
      console.error('❌ [ContentForm] Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      setErr(error?.response?.data?.message || error?.message || 'Erro desconhecido ao salvar');
    } finally {
      setStage('idle');
      helpers.setSubmitting(false);
      setPendingDto(null);
      setPendingHelpers(null);
    }
  };

  const onSubmit = async (
    dto: CreateContentDto,
    helpers: FormikHelpers<CreateContentDto>
  ) => {
    console.log('🔵 [ContentForm] onSubmit called with dto:', dto);

    if (!dto.channelId) {
      console.warn('⚠️ [ContentForm] No channelId, aborting submit');
      alert('Por favor, selecione um canal antes de salvar.');
      helpers.setSubmitting(false);
      return;
    }

    console.log('🔵 [ContentForm] Validation passed, proceeding...');

    // Intercepta se for edição e tiver push marcado
    if (editingId && dto.isPublished && dto.settings?.pushNotification) {
      console.log('🔵 [ContentForm] Showing push confirmation modal');
      setPendingDto(dto);
      setPendingHelpers(helpers);
      setShowPushConfirm(true);
      return;
    }

    console.log('🔵 [ContentForm] Calling processSubmit...');
    await processSubmit(dto, helpers);
  };

  return (
    <>
      {/* Modal de Confirmação de Push */}
      {showPushConfirm && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Reenviar Notificação?</h5>
                <button type="button" className="btn-close" onClick={() => setShowPushConfirm(false)}></button>
              </div>
              <div className="modal-body">
                <p>Este conteúdo está marcado para enviar uma notificação push.</p>
                <p>Deseja reenviar a notificação para a audiência?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-light" onClick={() => handlePushConfirm(false)}>
                  Não, apenas salvar
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handlePushConfirm(true)}>
                  Sim, reenviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PageTitle>
        {intl.formatMessage({
          id: editingId ? 'COMMUNICATION.FORM.TITLE.EDIT' : 'COMMUNICATION.FORM.TITLE.CREATE',
          defaultMessage: editingId ? 'Editar comunicado' : 'Criar comunicado',
        })}
      </PageTitle>
      <Content>
        {err && (
          <div className="alert alert-danger">
            <strong>Erro ao salvar:</strong><br />
            {typeof err === 'string' ? err : intl.formatMessage({ id: 'COMMUNICATION.FORM.ALERT.ERROR' })}
          </div>
        )}

        {stage === 'upload' && (
          <div className="alert alert-info d-flex align-items-center">
            <span className="me-3">{intl.formatMessage({ id: 'COMMUNICATION.FORM.ALERT.UPLOAD' })}</span>
            <div className="progress w-100" style={{ height: 6 }}>
              <div
                className="progress-bar"
                role="progressbar"
                style={{ width: `${Math.round(uploadProgress * 100)}%` }}
                aria-valuenow={Math.round(uploadProgress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {stage === 'save' && (
          <div className="alert alert-primary">
            {intl.formatMessage({ id: 'COMMUNICATION.FORM.ALERT.SAVING' })}
          </div>
        )}

        <Formik initialValues={values} validationSchema={createNewSchema(intl)} onSubmit={onSubmit} enableReinitialize>
          {formik => {
            const { submitForm, isSubmitting } = formik;
            return (
              <Form id="kt_create_content_form" noValidate>
                {step === 1 ? (
                  <Step1
                    data={values}
                    setFieldValue={(f, v) => {
                      formik.setFieldValue(f, v);
                      handleChange(f, v);
                    }}
                    errors={formik.errors}
                    touched={formik.touched}
                  />
                ) : (
                  <Step2
                    data={values}
                    setFieldValue={(f, v) => {
                      formik.setFieldValue(f, v)
                      handleChange(f, v)
                    }}
                    errors={formik.errors}
                    touched={formik.touched}
                    editingId={editingId}
                  />
                )}

                <div className="d-flex flex-stack pt-10">
                  {step > 1 && (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={prev}
                    >
                      <KTSVG
                        path="../media/icons/duotune/arrows/arr063.svg"
                        className="svg-icon-2 me-0"
                      />
                      {intl.formatMessage({ id: 'COMMUNICATION.FORM.BUTTON.BACK', defaultMessage: 'Voltar' })}
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={next}
                    >
                      {intl.formatMessage({ id: 'COMMUNICATION.FORM.BUTTON.NEXT', defaultMessage: 'Avançar' })}
                      <KTSVG
                        path="../media/icons/duotune/arrows/arr064.svg"
                        className="svg-icon-2 ms-0"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={clsx('btn btn-primary', {
                        'indicator-progress': isSubmitting || stage !== 'idle',
                      })}
                      disabled={isSubmitting || stage !== 'idle'}
                      onClick={async () => {
                        console.log('🟢 [ContentForm] Save button clicked!');
                        console.log('🟢 [ContentForm] Current values:', values);
                        console.log('🟢 [ContentForm] Formik errors:', formik.errors);
                        console.log('🟢 [ContentForm] Formik isValid:', formik.isValid);
                        console.log('🟢 [ContentForm] Formik isSubmitting:', formik.isSubmitting);
                        console.log('🟢 [ContentForm] Formik touched:', formik.touched);

                        // Tenta via submitForm
                        console.log('🟢 [ContentForm] Calling submitForm()...');
                        const submitResult = submitForm();
                        console.log('🟢 [ContentForm] submitForm() returned:', submitResult);

                        // Aguarda 1 segundo e se onSubmit não foi chamado, chama direto
                        setTimeout(async () => {
                          console.log('🟡 [ContentForm] Checking if onSubmit was called...');
                          if (!formik.isSubmitting) {
                            console.warn('⚠️ [ContentForm] submitForm() did not trigger onSubmit! Calling directly...');
                            try {
                              // Valida manualmente
                              const errors = await formik.validateForm();
                              console.log('🟡 [ContentForm] Manual validation errors:', errors);

                              if (Object.keys(errors).length === 0) {
                                console.log('🟡 [ContentForm] No validation errors, calling onSubmit directly');
                                await onSubmit(formik.values, formik as any);
                              } else {
                                console.error('❌ [ContentForm] Validation failed:', errors);
                                alert('Erros de validação: ' + JSON.stringify(errors, null, 2));
                              }
                            } catch (e) {
                              console.error('❌ [ContentForm] Error during manual submit:', e);
                            }
                          }
                        }, 1000);
                      }}
                    >
                      {isSubmitting || stage !== 'idle'
                        ? intl.formatMessage({ id: 'COMMUNICATION.FORM.BUTTON.SAVING', defaultMessage: 'Salvando…' })
                        : intl.formatMessage({ id: 'COMMUNICATION.FORM.BUTTON.SAVE', defaultMessage: 'Salvar' })}
                    </button>
                  )}
                </div>
              </Form>
            );
          }}
        </Formik>
      </Content>
    </>
  );
};

export default ContentForm;
