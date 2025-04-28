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

interface ContentFormProps {
  initialValues: CreateContentDto;
  editingId?: string;
  onSaved: () => void;
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

  // nosso hook agora dispara onSaved() após criar/editar.
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

  // reseta valores quando abrimos o modal
  useEffect(() => {
    setValues(initialValues);
    setStep(1);
  }, [initialValues]);

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
    console.log('🚀 onSubmit payload:', dto);
    if (!dto.channelId) {
      helpers.setSubmitting(false);
      return;
    }
    const updateDto: UpdateContentDto = {
      title: dto.title,
      subtitle: dto.subtitle,
      content: dto.content,
      type: dto.type,
      channelId: dto.channelId,
      isPublished: dto.isPublished,
      attachments: [],         // uploads não implementados
      highlightImages: [],     // uploads não implementados
      settings: { ...dto.settings },
    };
    try {
      if (editingId) {
        console.log('✏️ Editing:', editingId);
        await editItem(editingId, updateDto);
      } else {
        console.log('🆕 Creating new content');
        await createItem(dto);
      }
    } catch (e) {
      console.error('Error in onSubmit:', e);
    } finally {
      console.log('⏱ onSubmit complete');
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
        <Formik
          initialValues={values}
          onSubmit={onSubmit}
          enableReinitialize
        >
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
                        path="/media/icons/duotune/arrows/arr063.svg"
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
                        path="/media/icons/duotune/arrows/arr064.svg"
                        className="svg-icon-2 ms-0"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={clsx('btn btn-primary', {
                        'indicator-progress': isSubmitting,
                      })}
                      disabled={isSubmitting}
                      onClick={() => {
                        console.log('💾 BOTÃO SALVAR clicado');
                        submitForm();
                      }}
                    >
                      {isSubmitting
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