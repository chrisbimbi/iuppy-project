// frontend/src/app/modules/surveys/views/SurveysList.tsx
import { FC } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
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
                    <span className="card-label fw-bold fs-3 mb-1">Enquetes Cadastradas</span>
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
                                <th>Título</th>
                                <th>Status</th>
                                <th>Criado em</th>
                                <th>Atualizado em</th>
                                <th># de Questões</th>
                                <th>Respostas</th>
                                <th className="text-end">Ações</th>
                            </tr>
                        </thead>

                        <tbody className="text-gray-600 fw-semibold">
                            {loading ? (
                                <tr>
                                    <td colSpan={8}>Carregando...</td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={8}>Nenhuma enquete encontrada.</td>
                                </tr>
                            ) : (
                                filteredData.map((survey) => {
                                    const hasQuestions = (survey.questions?.length ?? 0) > 0

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

                                            <td className="text-gray-800">{survey.title}</td>

                                            <td>
                                                {survey.status === SurveyStatus.Published ? (
                                                    <span className="badge badge-light-success">Ativa</span>
                                                ) : (
                                                    <span className="badge badge-light-danger">Inativa</span>
                                                )}
                                            </td>

                                            <td>{new Date(survey.createdAt as any).toLocaleDateString()}</td>
                                            <td>{new Date(survey.updatedAt as any).toLocaleDateString()}</td>

                                            <td>{survey.questions?.length ?? 0}</td>

                                            <td>
                                                <SurveyTotalResponses surveyId={survey.id} />
                                            </td>

                                            <td className="text-end">
                                                <div className="dropdown">
                                                    <button
                                                        className="btn btn-icon"
                                                        data-bs-toggle="dropdown"
                                                        aria-expanded="false"
                                                    >
                                                        <i className="bi bi-three-dots-vertical"></i>
                                                    </button>

                                                    <ul className="dropdown-menu dropdown-menu-end">
                                                        <li>
                                                            <button className="dropdown-item" onClick={() => onEdit(survey)}>
                                                                Editar
                                                            </button>
                                                        </li>

                                                        <li>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => navigate(`/surveys/${survey.id}/edit?step=3`)}
                                                                title="Ir direto para o passo de perguntas"
                                                            >
                                                                Ir para Questões
                                                            </button>
                                                        </li>

                                                        <li>
                                                            <button
                                                                className={clsx('dropdown-item', { disabled: !hasQuestions })}
                                                                onClick={() => {
                                                                    if (hasQuestions) navigate(`/surveys/${survey.id}/results`)
                                                                }}
                                                                title={
                                                                    hasQuestions
                                                                        ? 'Ver resultados da enquete'
                                                                        : 'Adicione perguntas para habilitar os resultados'
                                                                }
                                                            >
                                                                Ver Resultados
                                                            </button>
                                                        </li>

                                                        <li><hr className="dropdown-divider" /></li>

                                                        <li>
                                                            <button
                                                                className="dropdown-item"
                                                                onClick={() => onDuplicate(survey)}
                                                            >
                                                                Duplicar
                                                            </button>
                                                        </li>

                                                        <li>
                                                            <button
                                                                className="dropdown-item text-danger"
                                                                onClick={() => onDelete([survey.id])}
                                                            >
                                                                Excluir
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