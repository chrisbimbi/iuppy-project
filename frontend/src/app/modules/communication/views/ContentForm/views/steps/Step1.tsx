// frontend/src/app/modules/communication/views/ContentForm/steps/Step1.tsx
import React from 'react'
import { NewsType, CreateNewsDto } from '@shared/types'
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
    'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
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

  // quando o usuário adiciona novas imagens
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

  // quando o usuário adiciona novos anexos
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

  // remove imagem de destaque por índice
  const removeImage = (idx: number) => {
    const imgs = [...(data.highlightImages as HighlightImage[] || [])]
    imgs.splice(idx, 1)
    setFieldValue('highlightImages', imgs, true)
  }

  // remove anexo por índice
  const removeAttachment = (idx: number) => {
    const atts = [...(data.attachments as Attachment[] || [])]
    atts.splice(idx, 1)
    setFieldValue('attachments', atts, true)
  }

  // reordena via drag-and-drop
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const imgs = Array.from(data.highlightImages as HighlightImage[])
    const [moved] = imgs.splice(result.source.index, 1)
    imgs.splice(result.destination.index, 0, moved)
    setFieldValue('highlightImages', imgs, true)
  }

  // tradução de tipo
  function traduzirTipoNew(type: NewsType) {
    switch (type) {
      case NewsType.ANNOUNCEMENT:
        return intl.formatMessage({
          id: 'ANNOUNCEMENT',
          defaultMessage: 'Notificação',
        })
      case NewsType.ALERT:
        return intl.formatMessage({
          id: 'COMUNICADO_TYPE_ALERT',
          defaultMessage: 'Alerta',
        })
      case NewsType.UPDATE:
        return intl.formatMessage({
          id: 'COMUNICADO_TYPE_UPDATE',
          defaultMessage: 'Lembrete',
        })
      default:
        return intl.formatMessage({
          id: 'COMUNICADO_TYPE_UNKNOWN',
          defaultMessage: 'Desconhecido',
        })
    }
  }

  return (
    <div className="w-100">
      {/* Cabeçalho */}
      <div className="pb-10 pb-lg-15">
        <h2 className="fw-bolder text-dark d-flex align-items-center">
          Dados do post
          <i
            className="fas fa-exclamation-circle ms-2 fs-7"
            data-bs-toggle="tooltip"
            title="Preencha os detalhes do post"
          />
        </h2>
        <div className="text-gray-400 fw-bold fs-6">
          Preencha os detalhes do post
        </div>
      </div>

      {/* Imagens de Destaque */}
      <div className="fv-row mb-10">
        <label className="form-label required">Imagens de Destaque</label>
        <CustomDropzone
          onFilesAdded={handleHighlightImagesAdded}
          accept={imageAccept}
          maxFiles={10}
          maxSize={10 * 1024 * 1024}
          type="highlightImages"
          multiple
        />
        <ErrorMessage
          name="highlightImages"
          component="div"
          className="text-danger"
        />
        <span className="form-text text-muted">
          Máximo 10 imagens, até 10MB cada.
        </span>

        {data.highlightImages && data.highlightImages.length > 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="highlightImages">
              {(provided) => (
                <div
                  className="d-flex flex-wrap mt-5"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {(data.highlightImages as HighlightImage[]).map(
                    (img, idx) => (
                      <Draggable
                        key={idx}
                        draggableId={`img-${idx}`}
                        index={idx}
                      >
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
                              <KTSVG
                                path="../media/icons/duotune/general/gen027.svg"
                                className="svg-icon-2"
                              />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    )
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Título */}
      <div className="fv-row mb-10">
        <label className="form-label required">Título</label>
        <input
          type="text"
          name="title"
          className={`form-control form-control-lg form-control-solid ${
            touched.title && errors.title ? 'is-invalid' : ''
          }`}
          placeholder="Título do post"
          value={data.title}
          onChange={(e) => setFieldValue('title', e.target.value, true)}
        />
        <ErrorMessage
          name="title"
          component="div"
          className="invalid-feedback"
        />
      </div>

      {/* Subtítulo */}
      <div className="fv-row mb-10">
        <label className="form-label">Subtítulo</label>
        <input
          type="text"
          name="subtitle"
          className={`form-control form-control-lg form-control-solid ${
            touched.subtitle && errors.subtitle ? 'is-invalid' : ''
          }`}
          placeholder="Subtítulo opcional"
          value={data.subtitle || ''}
          onChange={(e) =>
            setFieldValue('subtitle', e.target.value, true)
          }
        />
        <ErrorMessage
          name="subtitle"
          component="div"
          className="invalid-feedback"
        />
      </div>

      {/* Tipo */}
      <div className="fv-row mb-10">
        <label className="form-label required">Tipo</label>
        <select
          name="type"
          className={`form-select form-select-lg form-select-solid ${
            touched.type && errors.type ? 'is-invalid' : ''
          }`}
          value={data.type}
          onChange={(e) =>
            setFieldValue('type', e.target.value as NewsType, true)
          }
        >
          <option value="">Selecione o tipo</option>
          {Object.values(NewsType).map((t) => (
            <option key={t} value={t}>
              {traduzirTipoNew(t)}
            </option>
          ))}
        </select>
        <ErrorMessage
          name="type"
          component="div"
          className="invalid-feedback"
        />
      </div>

      {/* Conteúdo */}
      <div className="fv-row mb-10">
        <label className="form-label required">Conteúdo</label>
        <QuillWrapper
          value={data.content}
          onChange={(c) => setFieldValue('content', c, true)}
          height="300px"
        />
        {touched.content && errors.content && (
          <div className="invalid-feedback d-block">
            {errors.content}
          </div>
        )}
      </div>

      {/* Anexos */}
      <div className="fv-row mb-10">
        <label className="form-label">Anexos</label>
        <CustomDropzone
          onFilesAdded={handleAttachmentsAdded}
          accept={attachmentAccept}
          maxFiles={10}
          maxSize={10 * 1024 * 1024}
          type="attachments"
          multiple
        />
        <ErrorMessage
          name="attachments"
          component="div"
          className="text-danger"
        />
        <span className="form-text text-muted">
          Máximo 10 arquivos, até 10MB cada.
        </span>

        {/* Previews de anexos */}
        {data.attachments && data.attachments.length > 0 && (
          <ul className="list-group mt-3">
            {(data.attachments as Attachment[]).map((att, idx) => (
              <li
                key={idx}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {att.name}
                </a>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeAttachment(idx)}
                >
                  <KTSVG
                    path="../media/icons/duotune/general/gen027.svg"
                    className="svg-icon-2"
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}