import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import { initialSurveyValues } from '../views/wizard/initialValues'
import { useGroups } from 'src/app/modules/groups/provider/useGroups'
import SurveyWizardForm from '../views/wizard/SurveyWizardForm'
import * as types from '@shared/types'

const SurveysPage: React.FC = () => {
    const { currentUser } = useAuth()
    const companyId = currentUser!.companyId
    const userId = currentUser!.id

    const { data: spaces = [] } = useSpaces(companyId)
    useGroups({ companyId }) // carregado se precisar em outros lugares

    const { data: surveys = [], loading } = useSurveys(companyId)

    const sortedData = useMemo(
        () =>
            surveys?.slice().sort(
                (a, b) =>
                    new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime()
            ),
        [surveys]
    )

    const [shouldRefetch, setShouldRefetch] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [editing, setEditing] = useState<Survey | null>(null)

    const formRef = useRef<HTMLDivElement>(null)
    const deleteRef = useRef<HTMLDivElement>(null)
    const [formModal, setFormModal] = useState<Modal | null>(null)
    const [deleteModal, setDeleteModal] = useState<Modal | null>(null)
    const [toDelete, setToDelete] = useState<string[]>([])

    useEffect(() => {
        if (formRef.current) setFormModal(Modal.getOrCreateInstance(formRef.current))
        if (deleteRef.current) setDeleteModal(Modal.getOrCreateInstance(deleteRef.current))
    }, [])

    useEffect(() => {
        if (shouldRefetch) {
            setShouldRefetch(false)
            window.location.reload()
        }
    }, [shouldRefetch])

    const openCreate = () => {
        setEditing(null)
        Modal.getOrCreateInstance(formRef.current!).show()
    }

    const openEdit = (survey: Survey) => {
        setEditing(survey)
        Modal.getOrCreateInstance(formRef.current!).show()
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

    const onSaved = () => {
        formModal?.hide()
        setSelectedIds([])
        setShouldRefetch(true)
    }

    // ---------------- Filtro por espaço ----------------
    const [spaceFilter, setSpaceFilter] = useState<string | undefined>(undefined)
    const filteredData = useMemo(
        () =>
            (sortedData || []).filter(s => (spaceFilter ? s.spaceIds.includes(spaceFilter) : true)),
        [sortedData, spaceFilter]
    )

    // ---------------- Valores iniciais do form (create/edit) ----------------
    const formInitialValues = useMemo<types.CreateSurveyDto>(() => {
        if (!editing) {
            // criação: usa helper padrão e garante companyId correto
            const init = initialSurveyValues(companyId, userId)
            return { ...init, companyId }
        }

        // EDIT: normaliza para CreateSurveyDto (campos obrigatórios & tipos)
        const startsAtStr =
            editing.scheduleSurvey
                ? (typeof editing.startsAt === 'string'
                    ? editing.startsAt
                    : (editing.startsAt ? (editing.startsAt as Date).toISOString() : ''))
                : ''

        const endsAtStr =
            editing.expireSurvey
                ? (typeof editing.endsAt === 'string'
                    ? editing.endsAt
                    : (editing.endsAt ? (editing.endsAt as Date).toISOString() : ''))
                : ''

        return {
            companyId,                          // <== OBRIGATÓRIO NO DTO
            title: editing.title || '',
            description: editing.description || '',
            authorId: userId,
            adminIds: editing.adminIds?.length ? editing.adminIds : [userId],
            spaceIds: editing.spaceIds || [],
            visibility: (editing.visibility as types.CreateSurveyDto['visibility']) || 'public',
            notifyUsers: !!editing.notifyUsers,
            pushNotification: !!editing.pushNotification,
            // pushContent/pushTitle só fazem sentido se pushNotification ativo; podem ser omitidos
            ...(editing.pushNotification ? { pushContent: editing.pushContent || '' } : {}),
            ...(editing.pushNotification ? { pushTitle: editing.pushTitle || '' } : {}),
            acknowledgementRequired: !!editing.acknowledgementRequired,
            emailNotification: !!editing.emailNotification,
            inAppNotification: !!editing.inAppNotification,
            groupIds: editing.visibility === 'specific_groups' ? (editing.groupIds || []) : [],
            isAnonymous: !!editing.isAnonymous,
            scheduleSurvey: !!editing.scheduleSurvey,
            expireSurvey: !!editing.expireSurvey,
            startsAt: startsAtStr,              // obrigatórios no DTO: usa '' quando não aplicável
            endsAt: endsAtStr,                  // idem
            status: editing.status,
            createdAt: typeof editing.createdAt === 'string'
                ? editing.createdAt
                : (editing.createdAt as Date | undefined)?.toISOString(),
            updatedAt: typeof editing.updatedAt === 'string'
                ? editing.updatedAt
                : (editing.updatedAt as Date | undefined)?.toISOString(),
        }
    }, [editing, companyId, userId])

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

            {/* Modal: Wizard de criação/edição */}
            <div className="modal fade" ref={formRef} tabIndex={-1}>
                <div className="modal-dialog modal-xl">
                    <div className="modal-content p-5">
                        <SurveyWizardForm
                            key={editing?.id ?? 'new'}       // força re-montagem ao alternar
                            initialValues={formInitialValues} // passa valores normalizados
                            editingId={editing?.id}           // se existir, fará update
                            onSaved={onSaved}
                        />
                    </div>
                </div>
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