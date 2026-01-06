// frontend/src/app/modules/surveys/views/SurveysList.tsx
import { FC } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useIntl } from 'react-intl'
import { Survey, SurveyStatus } from '@shared/types'
import SurveyTotalResponses from './SurveyTotalResponses'

interface Props {
    data: Survey[]
    loading: boolean
    selectedIds: string[]
    onSelect: (ids: string[]) => void
    onEdit: (survey: Survey) => void
    onDelete: (ids: string[]) => void
    onDuplicate: (survey: Survey) => void
}

const SurveysList: FC<Props> = ({
    data,
    loading,
    selectedIds,
    onSelect,
    onEdit,
    onDelete,
    onDuplicate,
}) => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const intl = useIntl()

    const spaceId = searchParams.get('spaceId') || ''
    const filteredData = spaceId
        ? data.filter((survey) => survey.spaceIds?.includes(spaceId))
        : data

    const allChecked =
        filteredData.length > 0 &&
        filteredData.every((survey) => selectedIds.includes(survey.id))

    return (
        <div className="card">
            <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold fs-3 mb-1">{intl.formatMessage({ id: 'SURVEYS.LIST.TITLE', defaultMessage: 'Enquetes Cadastradas' })}</span>
                </h3>
            </div>

            <div className="card-body py-3">
                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                <th className="w-10px pe-2">
                                    <div className="form-check form-check-sm form-check-custom form-check-solid">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={allChecked}
                                            onChange={(e) => {
                                                onSelect(e.target.checked ? filteredData.map((s) => s.id) : [])
                                            }}
                                        />
                                    </div>
                                </th>
                                <th>{intl.formatMessage({ id: 'SURVEYS.LIST.HEADER.TITLE', defaultMessage: 'Título' })}</th>
                                <th>{intl.formatMessage({ id: 'SURVEYS.LIST.HEADER.STATUS', defaultMessage: 'Status' })}</th>
                                <th>{intl.formatMessage({ id: 'SURVEYS.LIST.HEADER.CREATED_AT', defaultMessage: 'Criado em' })}</th>
                                <th>{intl.formatMessage({ id: 'SURVEYS.LIST.HEADER.QUESTIONS', defaultMessage: '# de Questões' })}</th>
                                <th>{intl.formatMessage({ id: 'SURVEYS.LIST.HEADER.RESPONSES', defaultMessage: 'Respostas' })}</th>
                                <th className="text-end">{intl.formatMessage({ id: 'SURVEYS.LIST.HEADER.ACTIONS', defaultMessage: 'Ações' })}</th>
                            </tr>
                        </thead>

                        <tbody className="text-gray-600 fw-semibold">
                            {loading ? (
                                <tr>
                                    <td colSpan={8}>{intl.formatMessage({ id: 'SURVEYS.LIST.STATE.LOADING', defaultMessage: 'Carregando...' })}</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>{intl.formatMessage({ id: 'SURVEYS.LIST.STATE.EMPTY', defaultMessage: 'Nenhuma enquete encontrada.' })}</td>
                                </tr>
                            ) : (
                                filteredData.map((survey) => {
                                    const hasQuestions = (survey.questions?.length ?? 0) > 0
                                    const isPublished = survey.status === SurveyStatus.Published

                                    return (
                                        <tr key={survey.id}>
                                            <td>
                                                <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value={survey.id}
                                                        checked={selectedIds.includes(survey.id)}
                                                        onChange={(e) => {
                                                            const newSelected = e.target.checked
                                                                ? [...selectedIds, survey.id]
                                                                : selectedIds.filter((id) => id !== survey.id)
                                                            onSelect(newSelected)
                                                        }}
                                                    />
                                                </div>
                                            </td>

                                            <td>
                                                <span className="text-gray-800 fw-bold d-block fs-6">{survey.title}</span>
                                                <span className="text-muted fw-semibold d-block fs-7">{survey.description || ''}</span>
                                            </td>

                                            <td>
                                                {isPublished ? (
                                                    <span className="badge badge-light-success">{intl.formatMessage({ id: 'SURVEYS.LIST.STATUS.ACTIVE', defaultMessage: 'Ativa' })}</span>
                                                ) : (
                                                    <span className="badge badge-light-warning">{intl.formatMessage({ id: 'SURVEYS.LIST.STATUS.DRAFT', defaultMessage: 'Rascunho' })}</span>
                                                )}
                                            </td>

                                            <td>{new Date(survey.createdAt as any).toLocaleDateString()}</td>

                                            <td>{survey.questions?.length ?? 0}</td>

                                            <td>
                                                <span className="badge badge-light fw-bold text-muted px-3 py-2">
                                                    <SurveyTotalResponses surveyId={survey.id} />
                                                </span>
                                            </td>

                                            <td className="text-end">
                                                <div className="dropdown">
                                                    <button
                                                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                    >
                                                        <i className="bi bi-three-dots-vertical fs-3"></i>
                                                    </button>

                                                    <ul className="dropdown-menu dropdown-menu-end menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-200px py-4">
                                                        <li>
                                                            <button className="dropdown-item px-3" onClick={() => onEdit(survey)}>
                                                                {intl.formatMessage({ id: 'SURVEYS.LIST.ACTION.EDIT', defaultMessage: 'Editar' })}
                                                            </button>
                                                        </li>

                                                        {/* Atalho para editar perguntas se for rascunho */}
                                                        {!isPublished && (
                                                            <li>
                                                                <button
                                                                    className="dropdown-item px-3"
                                                                    onClick={() => navigate(`/modules/surveys/${survey.id}/edit?step=3`)}
                                                                >
                                                                    {intl.formatMessage({ id: 'SURVEYS.LIST.ACTION.EDIT_QUESTIONS', defaultMessage: 'Editar Perguntas' })}
                                                                </button>
                                                            </li>
                                                        )}

                                                        <li>
                                                            <button
                                                                className={clsx('dropdown-item px-3', { disabled: !hasQuestions })}
                                                                onClick={() => {
                                                                    if (hasQuestions) navigate(`/surveys/${survey.id}/results`)
                                                                }}
                                                            >
                                                                {intl.formatMessage({ id: 'SURVEYS.LIST.ACTION.RESULTS', defaultMessage: 'Ver Resultados' })}
                                                            </button>
                                                        </li>

                                                        <li><hr className="dropdown-divider" /></li>

                                                        <li>
                                                            <button
                                                                className="dropdown-item px-3"
                                                                onClick={() => onDuplicate(survey)}
                                                            >
                                                                {intl.formatMessage({ id: 'SURVEYS.LIST.ACTION.DUPLICATE', defaultMessage: 'Duplicar' })}
                                                            </button>
                                                        </li>

                                                        <li>
                                                            <button
                                                                className="dropdown-item px-3 text-danger"
                                                                onClick={() => onDelete([survey.id])}
                                                            >
                                                                {intl.formatMessage({ id: 'SURVEYS.LIST.ACTION.DELETE', defaultMessage: 'Excluir' })}
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default SurveysList