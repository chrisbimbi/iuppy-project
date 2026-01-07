// frontend/src/app/modules/communication/views/ContentForm/steps/Step1.tsx
import React from 'react'
import { CreateNewsDto } from '@shared/types'
import AsyncCreatableSelect from 'react-select/async-creatable'
import { ContentService } from '../../../../services/content.service'
import { ErrorMessage, FormikErrors, FormikTouched } from 'formik'
import { useIntl } from 'react-intl'
import { KTSVG } from '../../../../../../../helpers'
import QuillWrapper from '../../../../../../../components/QuillWrapper'
import CustomDropzone from '../../../../../../../components/CustomDropzone'
import { Accept } from 'react-dropzone'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd'

type HighlightImage = {
  url: string
  name: string
  file?: File
}

type Attachment = {
  url: string
  name: string
  file?: File
}

type StepProps = {
  data: CreateNewsDto
  setFieldValue: (
    field: string,
    value: any,
    shouldValidate?: boolean
  ) => void
  errors: FormikErrors<CreateNewsDto>
  touched: FormikTouched<CreateNewsDto>
}

export const Step1: React.FC<StepProps> = ({
  data,
  setFieldValue,
  errors,
  touched,
}) => {
  const intl = useIntl()

  const imageAccept: Accept = {
    'image/jpeg': ['.jpeg', '.jpg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
  }

  const attachmentAccept: Accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      '.xlsx',
    ],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
      '.pptx',
    ],
  }

  const handleHighlightImagesAdded = (files: File[]) => {
    const newImgs: HighlightImage[] = files.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
      file: f,
    }))
    setFieldValue(
      'highlightImages',
      [...(data.highlightImages as HighlightImage[] || []), ...newImgs],
      true
    )
  }

  const handleAttachmentsAdded = (files: File[]) => {
    const newAtts: Attachment[] = files.map((f) => ({
      url: URL.createObjectURL(f),
      name: f.name,
      file: f,
    }))
    setFieldValue(
      'attachments',
      [...(data.attachments as Attachment[] || []), ...newAtts],
      true
    )
  }

  const removeImage = (idx: number) => {
    const imgs = [...(data.highlightImages as HighlightImage[] || [])]
    imgs.splice(idx, 1)
    setFieldValue('highlightImages', imgs, true)
  }

  const removeAttachment = (idx: number) => {
    const atts = [...(data.attachments as Attachment[] || [])]
    atts.splice(idx, 1)
    setFieldValue('attachments', atts, true)
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const imgs = Array.from(data.highlightImages as HighlightImage[])
    const [moved] = imgs.splice(result.source.index, 1)
    imgs.splice(result.destination.index, 0, moved)
    setFieldValue('highlightImages', imgs, true)
  }



  return (
    <div className="w-100">
      <div className="pb-10 pb-lg-15">
        <h2 className="fw-bolder text-dark d-flex align-items-center">
          {intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.TITLE' })}
          <i className="fas fa-exclamation-circle ms-2 fs-7" data-bs-toggle="tooltip" title={intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.SUBTITLE' })} />
        </h2>
        <div className="text-gray-400 fw-bold fs-6">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.SUBTITLE' })}</div>
      </div>

      <div className="fv-row mb-10">
        <label className="form-label required">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.LABEL.HIGHLIGHT_IMAGES' })}</label>
        <CustomDropzone
          onFilesAdded={handleHighlightImagesAdded}
          accept={imageAccept}
          maxFiles={10}
          maxSize={10 * 1024 * 1024}
          type="highlightImages"
          multiple
        />
        <ErrorMessage name="highlightImages" component="div" className="text-danger" />
        <span className="form-text text-muted">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.HINT.IMAGES' })}</span>

        {data.highlightImages && data.highlightImages.length > 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="highlightImages">
              {(provided) => (
                <div className="d-flex flex-wrap mt-5" {...provided.droppableProps} ref={provided.innerRef}>
                  {(data.highlightImages as HighlightImage[]).map((img, idx) => (
                    <Draggable key={idx} draggableId={`img-${idx}`} index={idx}>
                      {(prov) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className="position-relative me-3 mb-3"
                          style={{
                            width: 120,
                            height: 80,
                            backgroundImage: `url(${img.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: 4,
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-icon btn-sm btn-active-color-primary position-absolute top-0 end-0"
                            onClick={() => removeImage(idx)}
                          >
                            <KTSVG path="../media/icons/duotune/general/gen027.svg" className="svg-icon-2" />
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

      <div className="fv-row mb-10">
        <label className="form-label required">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.LABEL.TITLE' })}</label>
        <input
          type="text"
          name="title"
          className={`form-control form-control-lg form-control-solid ${touched.title && errors.title ? 'is-invalid' : ''}`}
          placeholder={intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.PLACEHOLDER.TITLE' })}
          value={data.title}
          onChange={(e) => setFieldValue('title', e.target.value, true)}
        />
        <ErrorMessage name="title" component="div" className="invalid-feedback" />
      </div>

      <div className="fv-row mb-10">
        <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.LABEL.SUBTITLE' })}</label>
        <input
          type="text"
          name="subtitle"
          className={`form-control form-control-lg form-control-solid ${touched.subtitle && errors.subtitle ? 'is-invalid' : ''}`}
          placeholder={intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.PLACEHOLDER.SUBTITLE' })}
          value={data.subtitle || ''}
          onChange={(e) => setFieldValue('subtitle', e.target.value, true)}
        />
        <ErrorMessage name="subtitle" component="div" className="invalid-feedback" />
      </div>

      <div className="fv-row mb-10">
        <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.LABEL.HASHTAGS', defaultMessage: 'Hashtags' })}</label>
        <AsyncCreatableSelect
          isMulti
          cacheOptions
          defaultOptions
          loadOptions={(inputValue) => ContentService.getHashtags(inputValue).then(tags => tags.map(t => ({ label: t, value: t })))}
          onChange={(newValue) => setFieldValue('hashtags', newValue.map(v => v.value))}
          value={data.hashtags?.map(t => ({ label: t, value: t })) || []}
          placeholder={intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.PLACEHOLDER.HASHTAGS', defaultMessage: 'Digite ou selecione hashtags...' })}
          formatCreateLabel={(inputValue) => intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.CREATE_HASHTAG', defaultMessage: 'Criar "{tag}"' }, { tag: inputValue })}
          className="react-select-container"
          classNamePrefix="react-select"
        />
        <ErrorMessage name="hashtags" component="div" className="text-danger mt-2" />
      </div>

      <div className="fv-row mb-10">
        <label className="form-label required">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.LABEL.CONTENT' })}</label>
        <QuillWrapper
          value={data.content}
          onChange={(c) => setFieldValue('content', c, true)}
          height="300px"
          companyId={data.companyId}
        />
        {touched.content && errors.content && <div className="invalid-feedback d-block">{errors.content}</div>}
      </div>

      <div className="fv-row mb-10">
        <label className="form-label">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.LABEL.ATTACHMENTS' })}</label>
        <CustomDropzone
          onFilesAdded={handleAttachmentsAdded}
          accept={attachmentAccept}
          maxFiles={10}
          maxSize={10 * 1024 * 1024}
          type="attachments"
          multiple
        />
        <ErrorMessage name="attachments" component="div" className="text-danger" />
        <span className="form-text text-muted">{intl.formatMessage({ id: 'COMMUNICATION.FORM.STEP1.HINT.ATTACHMENTS' })}</span>

        {data.attachments && data.attachments.length > 0 && (
          <ul className="list-group mt-3">
            {(data.attachments as Attachment[]).map((att, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => removeAttachment(idx)}>
                  <KTSVG path="../media/icons/duotune/general/gen027.svg" className="svg-icon-2" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div >
  )
}