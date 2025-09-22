// frontend/src/app/modules/communication/views/ContentForm.tsx
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Formik, Form, FormikHelpers } from 'formik';
import { useIntl } from 'react-intl';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import { KTSVG } from 'src/helpers';
import { PageTitle } from 'src/layout/core';
import { Content } from 'src/layout/components/Content';
import {
  CreateNewsDto as CreateContentDto,
  UpdateNewsDto as UpdateContentDto,
} from '@shared/types';
import { useAuth } from 'src/app/modules/auth';
import { useContentActions } from '../../../providers/useContentActions';
import { uploadArrayOfFiles } from 'src/utils/fileUtils';

interface ContentFormProps {
  initialValues: CreateContentDto;
  editingId?: string;
  onSaved: () => void;
}

type LocalFileLike = { name: string; url: string; file?: File };

/**
 * Faz upload dos arrays (highlightImages e attachments) com progresso agregado (0..1).
 * Usa o uploadArrayOfFiles duas vezes e pondera o progresso por quantidade de arquivos.
 */
async function uploadAllAssets(
  companyId: string,
  authorId: string, // reservado para evoluções futuras (ex.: compor prefixos por autor)
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

  // nada para subir
  if (total === 0) {
    emit(1);
    const hi = await uploadArrayOfFiles(highlightImages || [], companyId, 'highlight');
    const at = await uploadArrayOfFiles(attachments || [], companyId, 'attachment');
    return { highlightImages: hi, attachments: at };
  }

  // 1) Highlight images
  let uploadedHighlight: Array<{ name: string; url: string }> = [];
  if (hiToUpload > 0) {
    uploadedHighlight = await uploadArrayOfFiles(
      highlightImages || [],
      companyId,
      'highlight',
      (p) => {
        // p.percent vai de 0..100 na lib; pondera pelo peso dos highlights
        const part = (hiToUpload / total) * (p.percent / 100);
        emit(part); // 0.. (hi/total)
      }
    );
  } else {
    uploadedHighlight = await uploadArrayOfFiles(highlightImages || [], companyId, 'highlight');
    emit(hiToUpload / total); // 0 se hiToUpload=0
  }

  // 2) Attachments
  let uploadedAttachments: Array<{ name: string; url: string }> = [];
  if (atToUpload > 0) {
    uploadedAttachments = await uploadArrayOfFiles(
      attachments || [],
      companyId,
      'attachment',
      (p) => {
        // parte já concluída pelos highlights
        const base = hiToUpload / total;
        const part = (atToUpload / total) * (p.percent / 100);
        emit(base + part); // base .. 1
      }
    );
  } else {
    uploadedAttachments = await uploadArrayOfFiles(attachments || [], companyId, 'attachment');
    emit(1);
  }

  emit(1);
  return { highlightImages: uploadedHighlight, attachments: uploadedAttachments };
}

const ContentForm: React.FC<ContentFormProps> = ({
  initialValues,
  editingId,
  onSaved,
}) => {
  const intl = useIntl();
  const { currentUser } = useAuth();
  const [values, setValues] = useState<CreateContentDto>(initialValues);
  const [step, setStep] = useState(1);
  const [err, setErr] = useState(false);

  // estágios do fluxo
  const [stage, setStage] = useState<'idle' | 'upload' | 'save'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // nosso hook dispara onSaved() após criar/editar.
  const { createItem, editItem } = useContentActions(onSaved);

  // popula authorId e companyId
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

      // 1) Upload
      setStage('upload');
      setUploadProgress(0);

      const uploaded = await uploadAllAssets(
        dto.companyId!, dto.authorId!,
        (dto.highlightImages as unknown as LocalFileLike[]) || [],
        (dto.attachments as unknown as LocalFileLike[]) || [],
        (fraction) => setUploadProgress(fraction)
      );

      // 2) Salvar
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
        settings: { ...dto.settings },
      };

      if (editingId) {
        await editItem(editingId, updateDto);
      } else {
        await createItem({
          ...dto,
          attachments: uploaded.attachments,
          highlightImages: uploaded.highlightImages as any,
        } as any);
      }
      // sucesso — o modal fecha via onSaved()
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
                      formik.setFieldValue(f, v);
                      handleChange(f, v);
                    }}
                    errors={formik.errors}
                    touched={formik.touched}
                    // Passe se o seu Step2 aceitar; caso não aceite, pode remover a prop abaixo.
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
                      {intl.formatMessage({ id: 'BUTTON.BACK' })}
                    </button>
                  )}
                  {step < 2 ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={next}
                    >
                      {intl.formatMessage({ id: 'BUTTON.NEXT' })}
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
                        ? intl.formatMessage({ id: 'BUTTON.SAVING' })
                        : intl.formatMessage({ id: 'BUTTON.SAVE' })}
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