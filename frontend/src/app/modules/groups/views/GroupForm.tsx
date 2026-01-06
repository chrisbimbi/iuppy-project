// frontend/src/app/modules/groups/views/GroupForm.tsx
import React from 'react'
import { useIntl } from 'react-intl'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { CreateGroupDto, UserGroupType } from '@shared/types'

interface Props {
  initialValues: CreateGroupDto
  editing: boolean
  onSave(values: CreateGroupDto | any): void
  onCancel(): void
}

const GroupForm: React.FC<Props> = ({ initialValues, editing, onSave, onCancel }) => {
  const intl = useIntl()
  const schema = Yup.object().shape({
    name: Yup.string().required(intl.formatMessage({ id: 'GROUPS.FORM.ERROR.NAME_REQUIRED', defaultMessage: 'Name is required' })),
    type: Yup.mixed<UserGroupType>()
      .oneOf(Object.values(UserGroupType))
      .required(intl.formatMessage({ id: 'GROUPS.FORM.ERROR.TYPE_REQUIRED', defaultMessage: 'Type is required' })),
  })

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={schema}
      onSubmit={values => onSave(values)}
    >
      {({ isSubmitting }) => (
        <Form>
          <div className="modal-header">
            <h5 className="modal-title">{editing ? intl.formatMessage({ id: 'GROUPS.FORM.TITLE.EDIT', defaultMessage: 'Edit Group' }) : intl.formatMessage({ id: 'GROUPS.FORM.TITLE.NEW', defaultMessage: 'New Group' })}</h5>
            <button type="button" className="btn-close" onClick={onCancel} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">{intl.formatMessage({ id: 'GROUPS.FORM.LABEL.NAME', defaultMessage: 'Name' })}</label>
              <Field name="name" className="form-control" />
              <div className="text-danger"><ErrorMessage name="name" /></div>
            </div>
            <div className="mb-3">
              <label className="form-label">{intl.formatMessage({ id: 'GROUPS.FORM.LABEL.IDENTIFIER', defaultMessage: 'Identifier' })}</label>
              <Field name="identifier" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">{intl.formatMessage({ id: 'GROUPS.FORM.LABEL.TYPE', defaultMessage: 'Type' })}</label>
              <Field as="select" name="type" className="form-select">
                {Object.values(UserGroupType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Field>
            </div>

            <div className="mb-3 form-check">
              <Field type="checkbox" name="isChatEnabled" className="form-check-input" id="isChatEnabled" />
              <label className="form-check-label" htmlFor="isChatEnabled">
                {intl.formatMessage({ id: 'GROUPS.FORM.LABEL.CHAT_ENABLED', defaultMessage: 'Habilitar Chat de Grupo?' })}
              </label>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-light" onClick={onCancel}>{intl.formatMessage({ id: 'GROUPS.FORM.BUTTON.CANCEL', defaultMessage: 'Cancel' })}</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{editing ? intl.formatMessage({ id: 'GROUPS.FORM.BUTTON.SAVE', defaultMessage: 'Save' }) : intl.formatMessage({ id: 'GROUPS.FORM.BUTTON.CREATE', defaultMessage: 'Create' })}</button>
          </div>
        </Form>
      )}
    </Formik>
  )
}

export default GroupForm