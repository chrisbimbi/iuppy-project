// frontend/src/app/modules/communication/views/ContentForm.tsx
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Formik, Form, FormikHelpers } from 'formik';
import { useIntl } from 'react-intl';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import {
  CreateNewsDto as CreateContentDto,
  UpdateNewsDto as UpdateContentDto
} from '@shared/types';
import { useAuth } from 'src/app/modules/auth';
import { useContentActions } from '../../../providers/useContentActions';
import { PageTitle } from 'src/layout/core';
import { Content } from 'src/layout/components/Content';
import { createNewSchema } from '../helpers/validationSchemas';
import { KTSVG } from 'src/helpers';

interface ContentFormProps {
  initialValues: CreateContentDto;
  editingId?: string;
  onSaved: () => void;
}

const CreateContentPage: React.FC<ContentFormProps> = ({
  initialValues,
  editingId,
  onSaved,
}) => {
  const [step, setStep] = useState(1);
  const { currentUser } = useAuth();
  const [values, setValues] = useState<CreateContentDto>(initialValues);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const intl = useIntl();

  // useContentActions no longer provides a loading flag
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
    setValues(initialValues);
    setStep(1);
    setOk(false);
    setErr(false);
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
    if (!dto.channelId) {
      setErr(true);
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
      attachments: dto.attachments,
      highlightImages: dto.highlightImages.map(i => ({
        url: i.url,
        altText: i.name,
      })),
      settings: { ...dto.settings },
    };

    try {
      if (editingId) {
        await editItem(editingId, updateDto);
      } else {
        await createItem(dto);
      }
      setErr(false);
      setOk(true);
      setTimeout(() => {
        setOk(false);
        setStep(1);
        setValues({ ...initialValues, authorId: dto.authorId, companyId: dto.companyId });
        onSaved();
      }, 1000);
    } catch {
      setErr(true);
    } finally {
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
                  <button type="button" className="btn btn-light" onClick={prev}>
                    <KTSVG
                      path="../media/icons/duotune/arrows/arr063.svg"
                      className="svg-icon-2 me-0"
                    />
                    {intl.formatMessage({ id: 'BUTTON.BACK' })}
                  </button>
                )}
                {step < 2 ? (
                  <button type="button" className="btn btn-primary" onClick={next}>
                    {intl.formatMessage({ id: 'BUTTON.NEXT' })}
                    <KTSVG
                      path="../media/icons/duotune/arrows/arr064.svg"
                      className="svg-icon-2 ms-0"
                    />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className={clsx('btn btn-primary', {
                      'indicator-progress': formik.isSubmitting,
                    })}
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting
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

export const ContentForm: React.FC<ContentFormProps> = props => (
  <CreateContentPage {...props} />
);