// frontend/src/app/modules/surveys/views/wizard/SurveyStep2Publish.tsx
import { FC } from 'react'
import { useIntl } from 'react-intl'
import { CreateSurveyDto, SurveyStatus } from '@shared/types'

type Props = {
    data: CreateSurveyDto
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

const toLocalInputValue = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return tz.toISOString().slice(0, 16)
}

const SurveyStep2Publish: FC<Props> = ({ data, setFieldValue }) => {
    const scheduleOn = !!data.scheduleSurvey
    const expireOn = !!data.expireSurvey
    const intl = useIntl()

    return (
        <div className="w-100">
            <div className="pb-8">
                <h3 className="fw-bold text-dark">{intl.formatMessage({ id: 'SURVEYS.STEP2.TITLE', defaultMessage: 'Publicação & Notificações' })}</h3>
                <div className="text-muted">{intl.formatMessage({ id: 'SURVEYS.STEP2.SUBTITLE', defaultMessage: 'Status, agendamento, expiração e notificações' })}</div>
            </div>

            <div className="mb-6">
                <label className="form-label">{intl.formatMessage({ id: 'SURVEYS.STEP2.LABEL.STATUS', defaultMessage: 'Status' })}</label>
                <select
                    className="form-select"
                    value={data.status || 'draft'}
                    onChange={(e) => setFieldValue('status', e.target.value as SurveyStatus, true)}
                >
                    <option value="draft">{intl.formatMessage({ id: 'SURVEYS.STEP2.OPTION.DRAFT', defaultMessage: 'Rascunho' })}</option>
                    <option value="published">{intl.formatMessage({ id: 'SURVEYS.STEP2.OPTION.PUBLISHED', defaultMessage: 'Publicada' })}</option>
                    <option value="archived">{intl.formatMessage({ id: 'SURVEYS.STEP2.OPTION.ARCHIVED', defaultMessage: 'Arquivada' })}</option>
                </select>
            </div>

            <div className="row">
                <div className="col-md-6 mb-6">
                    <div className="form-check form-switch form-switch-custom form-switch-solid">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={scheduleOn}
                            onChange={e => setFieldValue('scheduleSurvey', e.target.checked, true)}
                        />
                        <label className="form-check-label">{intl.formatMessage({ id: 'SURVEYS.STEP2.CHECKBOX.SCHEDULE', defaultMessage: 'Agendar início' })}</label>
                    </div>
                    {scheduleOn && (
                        <input
                            type="datetime-local"
                            className="form-control form-control-solid mt-2"
                            value={toLocalInputValue(typeof data.startsAt === 'string' ? data.startsAt : '')}
                            onChange={e => setFieldValue('startsAt', new Date(e.target.value).toISOString(), true)}
                        />
                    )}
                </div>

                <div className="col-md-6 mb-6">
                    <div className="form-check form-switch form-switch-custom form-switch-solid">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={expireOn}
                            onChange={e => setFieldValue('expireSurvey', e.target.checked, true)}
                        />
                        <label className="form-check-label">{intl.formatMessage({ id: 'SURVEYS.STEP2.CHECKBOX.EXPIRE', defaultMessage: 'Definir expiração' })}</label>
                    </div>
                    {expireOn && (
                        <input
                            type="datetime-local"
                            className="form-control form-control-solid mt-2"
                            value={toLocalInputValue(typeof data.endsAt === 'string' ? data.endsAt : '')}
                            onChange={e => setFieldValue('endsAt', new Date(e.target.value).toISOString(), true)}
                        />
                    )}
                </div>
            </div>

            <div className="pb-4 mt-2">
                <h5 className="fw-semibold">{intl.formatMessage({ id: 'SURVEYS.STEP2.SECTION.NOTIFICATIONS', defaultMessage: 'Notificações' })}</h5>
            </div>
            <div className="row">
                <div className="col-md-4 mb-6">
                    <div className="form-check form-switch form-switch-custom form-switch-solid">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!data.pushNotification}
                            onChange={e => setFieldValue('pushNotification', e.target.checked, true)}
                        />
                        <label className="form-check-label">{intl.formatMessage({ id: 'SURVEYS.STEP2.CHECKBOX.PUSH', defaultMessage: 'Push' })}</label>
                    </div>
                    {data.pushNotification && (
                        <>
                            <input
                                className="form-control form-control-solid mt-2"
                                placeholder={intl.formatMessage({ id: 'SURVEYS.STEP2.PLACEHOLDER.PUSH_TITLE', defaultMessage: 'Título do push (opcional)' })}
                                value={data.pushTitle || ''}
                                onChange={e => setFieldValue('pushTitle', e.target.value, true)}
                            />
                            <textarea
                                className="form-control form-control-solid mt-2"
                                placeholder={intl.formatMessage({ id: 'SURVEYS.STEP2.PLACEHOLDER.PUSH_CONTENT', defaultMessage: 'Conteúdo do push (opcional)' })}
                                rows={2}
                                value={data.pushContent || ''}
                                onChange={e => setFieldValue('pushContent', e.target.value, true)}
                            />
                        </>
                    )}
                </div>
                <div className="col-md-4 mb-6">
                    <div className="form-check form-switch form-switch-custom form-switch-solid">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!data.emailNotification}
                            onChange={e => setFieldValue('emailNotification', e.target.checked, true)}
                        />
                        <label className="form-check-label">{intl.formatMessage({ id: 'SURVEYS.STEP2.CHECKBOX.EMAIL', defaultMessage: 'E-mail' })}</label>
                    </div>
                </div>
                <div className="col-md-4 mb-6">
                    <div className="form-check form-switch form-switch-custom form-switch-solid">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={!!data.inAppNotification}
                            onChange={e => setFieldValue('inAppNotification', e.target.checked, true)}
                        />
                        <label className="form-check-label">{intl.formatMessage({ id: 'SURVEYS.STEP2.CHECKBOX.IN_APP', defaultMessage: 'In-app' })}</label>
                    </div>
                </div>
            </div>

            <div className="pb-4 mt-2">
                <h5 className="fw-semibold">{intl.formatMessage({ id: 'SURVEYS.STEP2.SECTION.ACKNOWLEDGEMENT', defaultMessage: 'Confirmação do Colaborador' })}</h5>
            </div>
            <div className="form-check form-switch form-switch-custom form-switch-solid">
                <input
                    className="form-check-input"
                    type="checkbox"
                    checked={!!data.acknowledgementRequired}
                    onChange={e => setFieldValue('acknowledgementRequired', e.target.checked, true)}
                />
                <label className="form-check-label">{intl.formatMessage({ id: 'SURVEYS.STEP2.CHECKBOX.ACKNOWLEDGEMENT', defaultMessage: 'Exigir "Li e Concordo"' })}</label>
            </div>
        </div>
    )
}

export default SurveyStep2Publish
