// frontend/src/app/modules/groups/views/GroupForm.tsx
import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import {
  CreateGroupDto,
  UpdateGroupDto,
  UserGroupType,
} from '@shared/types'

interface Props {
  initialValues: CreateGroupDto
  editing: boolean
  onSave(values: CreateGroupDto | UpdateGroupDto): void
  onCancel(): void
}

const schema = Yup.object().shape({
  name: Yup.string().required('Nome é obrigatório'),
  type: Yup.mixed<UserGroupType>()
    .oneOf(Object.values(UserGroupType))
    .required('Tipo é obrigatório'),
})

const GroupForm: React.FC<Props> = ({
  initialValues,
  editing,
  onSave,
  onCancel,
}) => (
  <Formik
    initialValues={initialValues}
    validationSchema={schema}
    onSubmit={values => onSave(values)}
    enableReinitialize
  >
    {({ isSubmitting }) => (
      <Form>
        <div className="modal-header">
          <h5 className="modal-title">
            {editing ? 'Editar Grupo' : 'Novo Grupo'}
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={onCancel}
          />
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Nome</label>
            <Field name="name" className="form-control" />
            <div className="text-danger">
              <ErrorMessage name="name" />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Identifier</label>
            <Field name="identifier" className="form-control" />
          </div>
          <div className="mb-3">
            <label className="form-label">Tipo</label>
            <Field as="select" name="type" className="form-select">
              {Object.values(UserGroupType).map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Field>
          </div>
          <div className="mb-3">
            <label className="form-label">
              Administradores (selecione múltiplos)
            </label>
            <Field
              as="select"
              name="adminIds"
              className="form-select"
              multiple
            >
              {/* Estas opções virão de GroupsPage via props */}
              {/* Cada <option> value={user.id}>user.name</option> */}
            </Field>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-light"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {editing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </Form>
    )}
  </Formik>
)

export default GroupForm