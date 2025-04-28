// src/app/modules/news/components/CreateNewsWizard.tsx
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Formik, Form, FormikHelpers } from 'formik';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { KTSVG } from '../../../../helpers';
import { createNewSchema } from './helpers/validationSchemas';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import { CreateNewsDto, UpdateNewsDto } from '@shared/types';
import { useAuth } from '../../auth';
import { Content } from '../../../../layout/components/Content';
import { PageTitle } from '../../../../layout/core';
import { useSaveNews } from '../hooks/useSaveNews';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setValues(v => ({
        ...v,
        authorId: String(currentUser.id),
        companyId: currentUser.companyId,
      }));
    }
  }, [currentUser]);

  useEffect(() => setValues(initialValues), [initialValues]);

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
      alert('Selecione um canal antes de salvar.');
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
      highlightImages: dto.highlightImages.map(i => ({ url: i.url, altText: i.name })),
      settings: { ...dto.settings },
    };

    try {
      await save(dto, updateDto, helpers);
      setOk(true);
      setErr(false);
      setTimeout(() => {
        setOk(false);
        onSaved();
        navigate('/contents');
      }, 1000);
    } catch {
      setErr(true);
    }
  };

  return (
    <>
      <Content>
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
                    Voltar
                  </button>
                )}
                {step < 2 ? (
                  <button type="button" className="btn btn-primary" onClick={handleNext}>
                    Próximo
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={clsx('btn btn-primary', { 'indicator-progress': loading })}
                    disabled={loading}
                  >
                    {loading ? 'Salvando...' : 'Salvar'}
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
  const intl = useIntl();
  return (
    <>
      <PageTitle>{intl.formatMessage({ id: 'MENU.CREATE_COMUNICADO' })}</PageTitle>
      <CreateNewsPage {...props} />
    </>
  );
};