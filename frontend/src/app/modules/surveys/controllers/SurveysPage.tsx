// frontend/src/app/modules/surveys/controllers/SurveysPage.tsx
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
    const { groups = [] } = useGroups({ companyId }) // mantido se for usar depois
    const { data: surveys = [], loading } = useSurveys(companyId)

    // garante array "plano" tipado como Survey para o resto da página
    const list: Survey[] = (surveys ?? []) as unknown as Survey[]

    const sortedData = list
        .slice()
        .sort(
            (a, b) =>
                new Date(b.createdAt as any).getTime() -
                new Date(a.createdAt as any).getTime()
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

    // DUPLICA UMA ENQUETE (retorna quando TODAS as perguntas tiverem sido copiadas)
    const handleDuplicate = async (survey: Survey) => {
        // 1) Monta payload SÓ com campos permitidos pelo CreateSurveyDto
        const payload: Partial<Survey> = {
            companyId, // precisa ir no body pro DTO
            title: `${survey.title} (Cópia)`,
            description: survey.description || '',
            authorId: userId, // quem está duplicando vira autor
            adminIds: survey.adminIds?.length ? survey.adminIds : [userId],
            spaceIds: survey.spaceIds ?? [],
            visibility: survey.visibility,

            notifyUsers: !!survey.notifyUsers,
            emailNotification: !!survey.emailNotification,
            inAppNotification: !!survey.inAppNotification,
            pushNotification: !!survey.pushNotification,
            pushTitle: survey.pushTitle || undefined,
            pushContent: survey.pushContent || undefined,

            acknowledgementRequired: !!survey.acknowledgementRequired,

            scheduleSurvey: !!survey.scheduleSurvey,
            expireSurvey: !!survey.expireSurvey,
            startsAt:
                typeof survey.startsAt === 'string'
                    ? survey.startsAt
                    : (survey.startsAt as any)?.toISOString?.(),
            endsAt: survey.endsAt
                ? (typeof survey.endsAt === 'string'
                    ? survey.endsAt
                    : (survey.endsAt as any)?.toISOString?.())
                : undefined,

            isAnonymous: !!survey.isAnonymous,
            status: survey.status,
            groupIds: survey.groupIds ?? [],
        }

        // 2) Cria a cópia (sem perguntas)
        const created = await SurveyService.create(companyId, payload)

        // 3) Copia as perguntas na mesma ordem (sequencialmente)
        if (survey.questions?.length) {
            const ordered = survey.questions
                .slice()
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

            for (const q of ordered) {
                await SurveyService.addQuestion(companyId, created.id, {
                    order: q.order ?? 0,
                    type: q.type,
                    questionText: q.questionText ?? '',
                    description: q.description ?? undefined,
                    isRequired: !!q.isRequired,
                    shuffleOptions: !!q.shuffleOptions,
                    options: q.options ?? undefined,
                })
            }
        }

        // não dá refresh aqui para não interromper duplicações em massa
        return created.id
    }

    const filteredData = !spaceFilter
        ? sortedData
        : sortedData.filter(survey => survey.spaceIds.includes(spaceFilter))

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
                            onAction={async act => {
                                if (act === 'delete') {
                                    openDelete(selectedIds)
                                    return
                                }
                                // Duplicação em massa: executa em SÉRIE e só depois atualiza
                                for (const id of selectedIds) {
                                    const survey = list.find(s => s.id === id)
                                    if (survey) {
                                        try { await handleDuplicate(survey) } catch (e) { console.error(e) }
                                    }
                                }
                                setSelectedIds([])
                                setShouldRefetch(true)
                            }}
                        />
                    )}

                    <SurveysList
                        data={filteredData || []}
                        loading={loading}
                        selectedIds={selectedIds}
                        onSelect={setSelectedIds}
                        onEdit={openEdit}
                        onDelete={openDelete}
                        // Duplicação de UMA linha: espera concluir e só então refaz o fetch
                        onDuplicate={async (survey) => {
                            try { await handleDuplicate(survey as Survey) } finally { setShouldRefetch(true) }
                        }}
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