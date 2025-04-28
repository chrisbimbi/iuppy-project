// frontend/src/app/modules/news/components/steps/Step1.tsx

import React from 'react';
import { NewsType, CreateNewsDto } from '@shared/types';
import { ErrorMessage, FormikErrors, FormikTouched } from 'formik';
import { useIntl } from 'react-intl';
import { KTSVG } from '../../../../../../../helpers';
import QuillWrapper from '../../../../../../../components/QuillWrapper';
import CustomDropzone from '../../../../../../../components/CustomDropzone';
import { Accept } from 'react-dropzone';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

type StepProps = {
    data: CreateNewsDto;
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
    errors: FormikErrors<CreateNewsDto>;
    touched: FormikTouched<CreateNewsDto>;
};

export const Step1: React.FC<StepProps> = ({ data, setFieldValue, errors, touched }) => {
    const intl = useIntl();

    const imageAccept: Accept = {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    };

    const attachmentAccept: Accept = {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    };

    const handleHighlightImagesAdded = (newFiles: File[]) => {
        setFieldValue('highlightImages', [...(data.highlightImages || []), ...newFiles]);
        console.log('highlightImages:', [...(data.highlightImages || []), ...newFiles]);
    };

    const handleAttachmentsAdded = (newFiles: File[]) => {
        setFieldValue('attachments', [...(data.attachments || []), ...newFiles]);
        console.log('Attachments:', [...(data.attachments || []), ...newFiles]);
    };

    const removeImage = (index: number) => {
        const newImages = [...(data.highlightImages || [])];
        newImages.splice(index, 1);
        setFieldValue('highlightImages', newImages);
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const items = Array.from(data.highlightImages || []);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setFieldValue('highlightImages', items);
    };

    function traduzirTipoNew(type: NewsType): React.ReactNode {
        const intl = useIntl();

        switch (type) {
            case NewsType.ANNOUNCEMENT:
                return intl.formatMessage({ id: 'ANNOUNCEMENT', defaultMessage: 'Notificação' });
            case NewsType.ALERT:
                return intl.formatMessage({ id: 'COMUNICADO_TYPE_ALERT', defaultMessage: 'Alerta' });
            case NewsType.UPDATE:
                return intl.formatMessage({ id: 'COMUNICADO_TYPE_UPDATE', defaultMessage: 'Lembrete' });
            default:
                return intl.formatMessage({ id: 'COMUNICADO_TYPE_UNKNOWN', defaultMessage: 'Desconhecido' });
        }
    }
    return (
        <div className='w-100'>
            <div className='pb-10 pb-lg-15'>
                <h2 className='fw-bolder d-flex align-items-center text-dark'>
                    Dados do post
                    <i className='fas fa-exclamation-circle ms-2 fs-7' data-bs-toggle='tooltip' title='Preencha os detalhes do new'></i>
                </h2>
                <div className='text-gray-400 fw-bold fs-6'>
                    Preencha os detalhes do new
                </div>
            </div>

            <div className='fv-row mb-10'>
                <label className='form-label required'>Imagens de Destaque</label>
                <CustomDropzone
                    onFilesAdded={handleHighlightImagesAdded}
                    accept={imageAccept}
                    maxFiles={10}
                    maxSize={10485760} // 10MB
                    type="highlightImages"
                    multiple={true}
                />
                <ErrorMessage name='highlightImages' component='div' className='text-danger' />
                <span className='form-text text-muted'>Tamanho máximo do arquivo 10MB e máximo de 10 arquivos</span>

                {data.highlightImages && data.highlightImages.length > 0 && (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="highlightImages">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className='d-flex flex-wrap mt-5'>
                                    {data.highlightImages!.map((image: any, index) => (
                                        <Draggable key={index} draggableId={`image-${index}`} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className='image-input-wrapper w-125px h-125px m-3'
                                                    style={{
                                                        backgroundImage: `url(${image instanceof File ? URL.createObjectURL(image) : image})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center'
                                                    }}
                                                >
                                                    <button
                                                        type='button'
                                                        className='btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow'
                                                        data-kt-image-input-action='remove'
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        <KTSVG path='../media/icons/duotune/general/gen027.svg' className='svg-icon-2' />
                                                    </button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </div>

            <div className='fv-row mb-10'>
                <label className='form-label required'>Título</label>
                <input
                    type='text'
                    className={`form-control form-control-lg form-control-solid ${touched.title && errors.title ? 'is-invalid' : ''}`}
                    name='title'
                    placeholder='Título do new'
                    value={data.title}
                    onChange={(e) => setFieldValue('title', e.target.value)}
                />
                <ErrorMessage name='title' component='div' className='invalid-feedback' />
            </div>

            <div className='fv-row mb-10'>
                <label className='form-label'>Subtítulo</label>
                <input
                    type='text'
                    className={`form-control form-control-lg form-control-solid ${touched.subtitle && errors.subtitle ? 'is-invalid' : ''}`}
                    name='subtitle'
                    placeholder='Subtítulo do new (opcional)'
                    value={data.subtitle || ''}
                    onChange={(e) => setFieldValue('subtitle', e.target.value)}
                />
                <ErrorMessage name='subtitle' component='div' className='invalid-feedback' />
            </div>

            <div className='fv-row mb-10'>
                <label className='form-label required'>Tipo</label>
                <select
                    className={`form-select form-select-lg form-select-solid ${touched.type && errors.type ? 'is-invalid' : ''}`}
                    name='type'
                    value={data.type}
                    onChange={(e) => setFieldValue('type', e.target.value as NewsType)}
                >
                    <option value=''>Selecione o tipo</option>
                    {Object.values(NewsType).map((type) => (
                        <option key={type} value={type}>{traduzirTipoNew(type)}</option>
                    ))}
                </select>
                <ErrorMessage name='type' component='div' className='invalid-feedback' />
            </div>

            <div className='fv-row mb-10'>
                <label className='form-label required'>Conteúdo</label>
                <QuillWrapper
                    value={data.content}
                    onChange={(content: string) => setFieldValue('content', content)}
                    height="300px" />
                {touched.content && errors.content && (
                    <div className='invalid-feedback d-block'>{errors.content}</div>
                )}
            </div>

            <div className='fv-row mb-10'>
                <label className='form-label'>Anexos</label>
                <CustomDropzone
                    onFilesAdded={handleAttachmentsAdded}
                    accept={attachmentAccept}
                    maxFiles={10}
                    maxSize={10485760} // 10MB
                    type="attachments"
                    multiple={true}
                />
                <ErrorMessage name='attachments' component='div' className='text-danger' />
                <span className='form-text text-muted'>Tamanho máximo do arquivo 10MB e máximo de 10 arquivos</span>

            </div>
        </div>
    );
};