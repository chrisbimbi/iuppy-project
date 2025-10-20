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
  const [err, setErr] = useState(false);

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

  const onSubmit = async (
    dto: CreateContentDto,
    helpers: FormikHelpers<CreateContentDto>
  ) => {
    if (!dto.channelId) {
      helpers.setSubmitting(false);
      return;
    }
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
        type: dto.type,
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
    } catch (error) {
      console.error('Erro ao salvar conteúdo:', error);
      setErr(true);
    } finally {
      setStage('idle');
      helpers.setSubmitting(false);
    }
  };

  return (
    <>
      <PageTitle>
        {intl.formatMessage({
          id: editingId ? 'MENU.EDIT_COMUNICADO' : 'MENU.CREATE_COMUNICADO',
          defaultMessage: editingId ? 'Editar comunicado' : 'Criar comunicado',
        })}
      </PageTitle>
      <Content>
        {err && (
          <div className="alert alert-danger">
            Ocorreu um erro ao salvar o comunicado. Por favor, tente novamente.
          </div>
        )}

        {stage === 'upload' && (
          <div className="alert alert-info d-flex align-items-center">
            <span className="me-3">Fazendo upload de seus anexos e imagens…</span>
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
            Salvando o conteúdo…
          </div>
        )}

        <Formik initialValues={values} onSubmit={onSubmit} enableReinitialize>
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
                      {intl.formatMessage({ id: 'BUTTON.BACK', defaultMessage: 'Voltar' })}
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={next}
                    >
                      {intl.formatMessage({ id: 'BUTTON.NEXT', defaultMessage: 'Avançar' })}
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
                      onClick={() => submitForm()}
                    >
                      {isSubmitting || stage !== 'idle'
                        ? intl.formatMessage({ id: 'BUTTON.SAVING', defaultMessage: 'Salvando…' })
                        : intl.formatMessage({ id: 'BUTTON.SAVE', defaultMessage: 'Salvar' })}
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
