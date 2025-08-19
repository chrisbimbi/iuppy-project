import React, { useEffect, useRef, useState } from 'react'
import { Modal } from 'bootstrap'
import { PageTitle } from 'src/layout/core'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'
import { useAuth } from 'src/app/modules/auth'
import { useSpaces } from 'src/app/modules/spaces/hooks/useSpaces'
import { useSurveys } from '../providers/useSurveys'
import { Survey } from '@shared/types'

import SurveysList from '../views/SurveysList'
import { SurveyService } from '../services/surveys.service'
import BulkActionsBar from '../views/BulkActionsBar'
import { useGroups } from 'src/app/modules/groups/provider/useGroups'
import { useNavigate } from 'react-router-dom'

const SurveysPage: React.FC = () => {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const companyId = currentUser!.companyId
    const userId = currentUser!.id

    const { data: spaces = [] } = useSpaces(companyId)
    const { groups = [] } = useGroups({ companyId })
    const { data: surveys = [], loading } = useSurveys(companyId)
    const sortedData = surveys?.slice().sort(
        (a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
    )
    const [shouldRefetch, setShouldRefetch] = useState(false)

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const deleteRef = useRef<HTMLDivElement>(null)
    const [deleteModal, setDeleteModal] = useState<Modal | null>(null)
    const [toDelete, setToDelete] = useState<string[]>([])
    const [spaceFilter, setSpaceFilter] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (deleteRef.current) setDeleteModal(Modal.getOrCreateInstance(deleteRef.current))
    }, [])

    useEffect(() => {
        if (shouldRefetch) {
            setShouldRefetch(false)
            window.location.reload()
        }
    }, [shouldRefetch])

    const openCreate = () => {
        navigate(`/modules/surveys/new`)
    }

    const openEdit = (survey: Survey) => {
        navigate(`/modules/surveys/${survey.id}/edit`)
    }

    const openDelete = (ids: string[]) => {
        setToDelete(ids)
        deleteModal?.show()
    }

    const handleConfirmDelete = async () => {
        await Promise.all(toDelete.map(id => SurveyService.remove(companyId, id)))
        deleteModal?.hide()
        setSelectedIds([])
        setShouldRefetch(true)
    }

    const handleDuplicate = async (survey: Survey) => {
        const clone = {
            ...survey,
            id: undefined,
            title: `${survey.title} (Cópia)`,
            authorId: userId,
            adminIds: survey.adminIds?.length > 0 ? survey.adminIds : [userId],
            companyId,
            createdAt: typeof survey.createdAt === 'string' ? survey.createdAt : (survey.createdAt as Date).toISOString(),
            updatedAt: typeof survey.updatedAt === 'string' ? survey.updatedAt : (survey.updatedAt as Date).toISOString(),
            startsAt: typeof survey.startsAt === 'string' ? survey.startsAt : (survey.startsAt as Date).toISOString(),
            endsAt: survey.endsAt ? (typeof survey.endsAt === 'string' ? survey.endsAt : (survey.endsAt as Date).toISOString()) : '',
            groupIds: survey.groupIds ?? [],
        } as any

        await SurveyService.create(companyId, clone)
        setShouldRefetch(true)
    }

    const filteredData = sortedData?.filter(survey => {
        if (!spaceFilter) return true
        return survey.spaceIds.includes(spaceFilter)
    })

    return (
        <div className="app-container container-xxl">
            <div className="app-page" id="kt_app_page">
                <AsideDefault />
                <Content>
                    <PageTitle breadcrumbs={[]}>Pesquisas e Enquetes</PageTitle>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <select
                            className="form-select w-auto"
                            value={spaceFilter ?? ''}
                            onChange={(e) => setSpaceFilter(e.target.value || undefined)}
                        >
                            <option value="">Todos os Espaços</option>
                            {spaces.map((space) => (
                                <option key={space.id} value={space.id}>
                                    {space.name}
                                </option>
                            ))}
                        </select>

                        <button className="btn btn-primary" onClick={openCreate}>
                            Criar Enquete
                        </button>
                    </div>

                    {selectedIds.length > 0 && (
                        <BulkActionsBar
                            count={selectedIds.length}
                            onAction={act =>
                                act === 'delete'
                                    ? openDelete(selectedIds)
                                    : selectedIds.forEach(id => {
                                        const survey = surveys.find(s => s.id === id)
                                        if (survey) handleDuplicate(survey)
                                    })
                            }
                        />
                    )}

                    <SurveysList
                        data={filteredData || []}
                        loading={loading}
                        selectedIds={selectedIds}
                        onSelect={setSelectedIds}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        onDuplicate={handleDuplicate}
                    />
                </Content>
            </div>

            {/* Modal de Delete */}
            <div className="modal fade" ref={deleteRef} tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content p-5">
                        <h5>Confirmar exclusão?</h5>
                        <div className="d-flex justify-content-end gap-3 mt-4">
                            <button className="btn btn-light" onClick={() => deleteModal?.hide()}>
                                Cancelar
                            </button>
                            <button className="btn btn-danger" onClick={handleConfirmDelete}>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SurveysPage