import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Formik, Form, FormikProps, FormikHelpers } from 'formik';
import { KTSVG } from '../../../../helpers';
import { createNewSchema } from './helpers/validationSchemas';
import { Step1 } from './steps/Step1';
import { Step2 } from './steps/Step2';
import { CreateNewsDto, NewsType } from '@shared/types';
import { useAuth } from '../../auth';
import { v4 as uuidv4 } from 'uuid';
import { Toolbar } from '../../../../layout/components/toolbar/Toolbar';
import { Content } from '../../../../layout/components/Content';
import { PageTitle } from '../../../../layout/core';
import { toAbsoluteUrl } from '../../../../helpers';
import { useNavigate } from 'react-router-dom';

interface Props {
    initialValues: CreateNewsDto;
}

const CreateNewsPage: React.FC<Props> = ({ initialValues }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const { handleSubmit, loading, error, uploadProgress } = useCreateNews();
    const { currentUser } = useAuth();
    const [formValues, setFormValues] = useState<CreateNewsDto>(initialValues);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.getElementById('kt_layout_toolbar')?.classList.remove('d-none');
        return () => {
            document.getElementById('kt_layout_toolbar')?.classList.add('d-none');
        };
    }, []);

    useEffect(() => {
        if (!currentUser) {
            console.error('Usuário não autenticado');
        } else {
            setFormValues(prevValues => ({
                ...prevValues,
                authorId: currentUser.id ? String(currentUser.id) : uuidv4()
            }));
        }
    }, [currentUser]);

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 2));
    const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const handleFormChange = (field: string, value: any) => {
        setFormValues(prevValues => {
            if (field.startsWith('settings.')) {
                const settingField = field.split('.')[1];
                return {
                    ...prevValues,
                    settings: {
                        ...prevValues.settings,
                        [settingField]: value
                    }
                };
            }
            return { ...prevValues, [field]: value };
        });
    };

    const onSubmit = async (values: CreateNewsDto, helpers: FormikHelpers<CreateNewsDto>) => {
        try {
            await handleSubmit(values, helpers);
            setShowSuccessAlert(true);
            setShowErrorAlert(false);
            window.scrollTo(0, 0);
            setTimeout(() => {
                setShowSuccessAlert(false);
                navigate('/news');
            }, 3000);
        } catch (err: any) {
            console.error('Error submitting form:', err);
            setShowErrorAlert(true);
            setShowSuccessAlert(false);
            window.scrollTo(0, 0);
            setTimeout(() => setShowErrorAlert(false), 5000);
        }
    };

    return (
        <>
            <Toolbar />
            <Content>
                {showSuccessAlert && (
                    <div className="alert alert-success d-flex align-items-center p-5 mb-10">
                        <span className="svg-icon svg-icon-2hx svg-icon-success me-3">
                            <KTSVG path={toAbsoluteUrl('/media/icons/duotune/general/gen048.svg')} className="svg-icon-2hx" />
                        </span>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-success">Sucesso!</h4>
                            <span>O new foi criado com sucesso.</span>
                        </div>
                    </div>
                )}

                {showErrorAlert && (
                    <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
                        <span className="svg-icon svg-icon-2hx svg-icon-danger me-3">
                            <KTSVG path={toAbsoluteUrl('/media/icons/duotune/general/gen050.svg')} className="svg-icon-2hx" />
                        </span>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-danger">Ops...</h4>
                            <span>Um erro aconteceu ao criar o conteúdo... Tente novamente</span>
                        </div>
                    </div>
                )}
                <div className='row g-5 g-xl-8'>
                    <div className='col-xl-12'>
                        <div className='card'>
                            <div className='card-body'>
                                <div className='stepper stepper-pills stepper-column d-flex flex-column flex-xl-row flex-row-fluid'>
                                    {/* Aside */}
                                    <div className='d-flex justify-content-center justify-content-xl-start flex-row-auto w-100 w-xl-300px'>
                                        <div className='px-6 px-lg-10 px-xxl-15 py-20'>
                                            <div className='stepper-nav'>
                                                {[1, 2].map((step) => (
                                                    <div key={step} className={`stepper-item ${currentStep === step ? 'current' : ''}`}>
                                                        <div className='stepper-wrapper'>
                                                            <div className='stepper-icon w-40px h-40px'>
                                                                <i className='stepper-check fas fa-check'></i>
                                                                <span className='stepper-number'>{step}</span>
                                                            </div>
                                                            <div className='stepper-label'>
                                                                <h3 className='stepper-title'>
                                                                    {step === 1 ? 'Dados do New' : 'Opções de Publicação'}
                                                                </h3>
                                                                <div className='stepper-desc fw-semibold'>
                                                                    {step === 1 ? 'Detalhes básicos' : 'Configurações de publicação'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {step === 1 && <div className='stepper-line h-40px'></div>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Content */}
                                    <div className='flex-row-fluid py-lg-5 px-lg-15'>
                                        <Formik
                                            validationSchema={createNewSchema}
                                            initialValues={formValues}
                                            onSubmit={onSubmit}
                                            enableReinitialize
                                        >
                                            {(formikProps: FormikProps<CreateNewsDto>) => (
                                                <Form className='w-100' noValidate id='kt_create_new_form'>
                                                    <div className='current'>
                                                        {currentStep === 1 ? (
                                                            <Step1
                                                                data={formValues}
                                                                setFieldValue={(field: string, value: any) => {
                                                                    formikProps.setFieldValue(field, value);
                                                                    handleFormChange(field, value);
                                                                }}
                                                                errors={formikProps.errors}
                                                                touched={formikProps.touched}
                                                            />
                                                        ) : (
                                                            <Step2
                                                                data={formValues}
                                                                setFieldValue={(field: string, value: any) => {
                                                                    if (field.startsWith('settings.')) {
                                                                        const settingField = field.split('.')[1];
                                                                        formikProps.setFieldValue('settings', {
                                                                            ...formValues.settings,
                                                                            [settingField]: value
                                                                        });
                                                                    } else {
                                                                        formikProps.setFieldValue(field, value);
                                                                    }
                                                                    handleFormChange(field, value);
                                                                }}
                                                                errors={formikProps.errors}
                                                                touched={formikProps.touched}
                                                            />
                                                        )}
                                                    </div>

                                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                                        <div className="progress mt-5">
                                                            <div
                                                                className="progress-bar"
                                                                role="progressbar"
                                                                style={{ width: `${uploadProgress}%` }}
                                                                aria-valuenow={uploadProgress}
                                                                aria-valuemin={0}
                                                                aria-valuemax={100}
                                                            >
                                                                {uploadProgress.toFixed(0)}%
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className='d-flex flex-stack pt-10'>
                                                        <div className='mr-2'>
                                                            <button
                                                                type='button'
                                                                className='btn btn-lg btn-light-primary me-3'
                                                                onClick={handlePrevious}
                                                                disabled={currentStep === 1}
                                                            >
                                                                <KTSVG
                                                                    path='../media/icons/duotune/arrows/arr063.svg'
                                                                    className='svg-icon-4 me-1'
                                                                />
                                                                Voltar
                                                            </button>
                                                        </div>
                                                        <div>
                                                            {currentStep === 2 ? (
                                                                <button
                                                                    type='submit'
                                                                    className='btn btn-lg btn-primary me-3'
                                                                    disabled={formikProps.isSubmitting || loading}
                                                                >
                                                                    <span className='indicator-label'>
                                                                        Criar
                                                                        <KTSVG
                                                                            path='../media/icons/duotune/arrows/arr064.svg'
                                                                            className='svg-icon-3 ms-2 me-0'
                                                                        />
                                                                    </span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type='button'
                                                                    className='btn btn-lg btn-primary'
                                                                    onClick={handleNext}
                                                                >
                                                                    Próximo
                                                                    <KTSVG
                                                                        path='../media/icons/duotune/arrows/arr064.svg'
                                                                        className='svg-icon-4 ms-1 me-0'
                                                                    />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Form>
                                            )}
                                        </Formik>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {showSuccessAlert && (
                    <div className="alert alert-success d-flex align-items-center p-5 mb-10">
                        <span className="svg-icon svg-icon-2hx svg-icon-success me-3">
                            <KTSVG path={toAbsoluteUrl('/media/icons/duotune/general/gen048.svg')} className="svg-icon-2hx" />
                        </span>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-success">Sucesso!</h4>
                            <span>O new foi criado com sucesso.</span>
                        </div>
                    </div>
                )}
                {showErrorAlert && (
                    <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
                        <span className="svg-icon svg-icon-2hx svg-icon-danger me-3">
                            <KTSVG path={toAbsoluteUrl('/media/icons/duotune/general/gen050.svg')} className="svg-icon-2hx" />
                        </span>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-danger">Ops...</h4>
                            <span>Um erro aconteceu ao criar o conteúdo... Tente novamente</span>
                        </div>
                    </div>
                )}
            </Content>
        </>
    );
};

const CreateNewWrapper: React.FC<Props> = ({ initialValues }) => {
    const intl = useIntl();
    return (
        <>
            <PageTitle breadcrumbs={[]}>{intl.formatMessage({ id: 'MENU.CREATE_COMUNICADO' })}</PageTitle>
            <CreateNewsPage initialValues={initialValues} />
        </>
    );
};

export { CreateNewWrapper };
    function useCreateNews(): { handleSubmit: any; loading: any; error: any; uploadProgress: any; } {
        throw new Error('Function not implemented.');
    }

