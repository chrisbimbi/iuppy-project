// src/app/modules/news/components/CreateNewsWizard.tsx
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Formik, Form, FormikHelpers } from 'formik';
import { useIntl } from 'react-intl';
import { KTSVG } from '../../../../helpers';
import { createNewSchema } from './helpers/validationSchemas';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import { CreateNewsDto, UpdateNewsDto } from '@shared/types';
import { useAuth } from '../../auth';
import { Content } from '../../../../layout/components/Content';
import { PageTitle } from '../../../../layout/core';
import { useSaveNews } from '../hooks/useSaveNews';
import { initialNewValues } from './helpers/initialValues';

interface WizardProps {
  initialValues: CreateNewsDto;
  editingId?: string;
  onSaved: () => void;
}

export const CreateNewsPage: React.FC<WizardProps> = ({
  initialValues,
  editingId,
  onSaved,
}) => {
  const [step, setStep] = useState(1);
  const { save, loading } = useSaveNews(editingId);
  const { currentUser } = useAuth();
  const [values, setValues] = useState<CreateNewsDto>(initialValues);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const intl = useIntl();

  // Preenche authorId e companyId vindos do usuário
  useEffect(() => {
    if (currentUser) {
      setValues(v => ({
        ...v,
        authorId: String(currentUser.id),
        companyId: currentUser.companyId,
      }));
    }
  }, [currentUser]);

  // Re-inicializa valores quando initialValues mudar
  useEffect(() => {
    setValues(initialValues);
    setStep(1);
    setOk(false);
    setErr(false);
  }, [initialValues]);

  const handleNext = () => setStep(s => Math.min(s + 1, 2));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));
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
    dto: CreateNewsDto,
    helpers: FormikHelpers<CreateNewsDto>
  ) => {
    if (!dto.channelId) {
      setErr(true);
      return;
    }
    const updateDto: UpdateNewsDto = {
      title: dto.title,
      subtitle: dto.subtitle,
      content: dto.content,
      type: dto.type,
      channelId: dto.channelId,
      isPublished: dto.isPublished,
      attachments: dto.attachments,
      highlightImages: dto.highlightImages.map(i => ({
        url: i.url,
        altText: i.name,
      })),
      settings: { ...dto.settings },
    };

    try {
      await save(dto, updateDto, helpers);
      setErr(false);
      setOk(true);

      // Exibe alerta e, após breve pausa, limpa e fecha modal
      setTimeout(() => {
        setOk(false);
        // reseta wizard para um novo post
        setStep(1);
        setValues({ ...initialValues, authorId: dto.authorId, companyId: dto.companyId });
        onSaved();
      }, 1000);
    } catch {
      setErr(true);
    }
  };

  return (
    <>
      <PageTitle>{intl.formatMessage({ id: editingId ? 'MENU.EDIT_COMUNICADO' : 'MENU.CREATE_COMUNICADO' })}</PageTitle>
      <Content>
        {ok && (
          <div className="alert alert-success">
            {intl.formatMessage({ id: 'ALERT.SAVE_SUCCESS' }, { item: 'comunicado' })}
          </div>
        )}
        {err && (
          <div className="alert alert-danger">
            {intl.formatMessage({ id: 'ALERT.SAVE_ERROR' })}
          </div>
        )}

        <Formik
          initialValues={values}
          validationSchema={createNewSchema}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {formik => (
            <Form id="kt_create_new_form" noValidate>
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
                  <button type="button" className="btn btn-light" onClick={handlePrev}>
                    <KTSVG path="/media/icons/duotune/arrows/arr063.svg" className="svg-icon-2 me-0" />
                    {intl.formatMessage({ id: 'BUTTON.BACK' })}
                  </button>
                )}
                {step < 2 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNext}
                  >
                    {intl.formatMessage({ id: 'BUTTON.NEXT' })}
                    <KTSVG path="/media/icons/duotune/arrows/arr064.svg" className="svg-icon-2 ms-0" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={clsx('btn btn-primary', { 'indicator-progress': loading })}
                    disabled={loading}
                  >
                    {loading
                      ? intl.formatMessage({ id: 'BUTTON.SAVING' })
                      : intl.formatMessage({ id: 'BUTTON.SAVE' })}
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </Content>
    </>
  );
};

export const CreateNewWrapper: React.FC<WizardProps> = props => {
  return <CreateNewsPage {...props} />;
};