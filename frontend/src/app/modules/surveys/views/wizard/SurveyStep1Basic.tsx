// frontend/src/app/modules/surveys/views/wizard/SurveyStep1Basic.tsx
import { FC, useMemo } from 'react'
import { CreateSurveyDto } from '@shared/types'
import { useAuth } from 'src/app/modules/auth'
import { useSpaces } from 'src/app/modules/spaces/hooks/useSpaces'
import { useGroups } from 'src/app/modules/groups/provider/useGroups'

type Props = {
    data: CreateSurveyDto
    setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void
}

const SurveyStep1Basic: FC<Props> = ({ data, setFieldValue }) => {
    const { currentUser } = useAuth()
    const companyId = currentUser!.companyId
    const { data: spaces = [] } = useSpaces(companyId)
    const { groups = [] } = useGroups({ companyId })

    const selectedGroups = useMemo(
        () => groups.filter(g => (data.groupIds ?? []).includes(g.id)),
        [groups, data.groupIds]
    )

    return (
        <div className="w-100">
            <div className="pb-8">
                <h3 className="fw-bold text-dark">Informações Básicas</h3>
                <div className="text-muted">Título, descrição, espaços e visibilidade</div>
            </div>

            <div className="mb-6">
                <label className="form-label required">Título</label>
                <input
                    className="form-control"
                    value={data.title}
                    onChange={e => setFieldValue('title', e.target.value, true)}
                    placeholder="Digite um título"
                    required
                />
            </div>

            <div className="mb-6">
                <label className="form-label">Descrição</label>
                <textarea
                    className="form-control"
                    value={data.description || ''}
                    onChange={e => setFieldValue('description', e.target.value, true)}
                    rows={3}
                />
            </div>

            <div className="mb-6">
                <label className="form-label required">Espaços</label>
                <select
                    className="form-select"
                    multiple
                    value={data.spaceIds}
                    onChange={e =>
                        setFieldValue(
                            'spaceIds',
                            Array.from(e.currentTarget.selectedOptions, o => o.value),
                            true
                        )
                    }
                >
                    {spaces.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
                <div className="form-text">Selecione pelo menos 1 espaço</div>
            </div>

            <div className="mb-6">
                <label className="form-label required">Visibilidade</label>
                <select
                    className="form-select"
                    value={data.visibility}
                    onChange={e => setFieldValue('visibility', e.target.value, true)}
                >
                    <option value="public">Público (todos do(s) espaço(s))</option>
                    <option value="private">Privado (apenas admins)</option>
                    <option value="specific_groups">Grupos específicos</option>
                </select>
            </div>

            {data.visibility === 'specific_groups' && (
                <div className="mb-6">
                    <label className="form-label required">Grupos</label>
                    <select
                        className="form-select"
                        multiple
                        value={data.groupIds ?? []}
                        onChange={e =>
                            setFieldValue(
                                'groupIds',
                                Array.from(e.currentTarget.selectedOptions, o => o.value),
                                true
                            )
                        }
                    >
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>

                    {selectedGroups.length > 0 && (
                        <div className="mt-2">
                            {selectedGroups.map(g => (
                                <span key={g.id} className="badge badge-primary me-1">{g.name}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="form-check mb-6">
                <input
                    id="chk-anon"
                    type="checkbox"
                    className="form-check-input"
                    checked={!!data.isAnonymous}
                    onChange={e => setFieldValue('isAnonymous', e.target.checked, true)}
                />
                <label className="form-check-label" htmlFor="chk-anon">
                    Enquete anônima
                </label>
            </div>
        </div>
    )
}

export default SurveyStep1Basic
