import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from 'src/app/modules/auth'
import { Survey } from '@shared/types'
import { SurveyService } from '../services/surveys.service'
import SurveyWizardForm from '../views/wizard/SurveyWizardForm'
import { initialSurveyValues } from '../views/wizard/initialValues'
import { PageTitle } from 'src/layout/core'
import { AsideDefault } from 'src/layout/components/aside/AsideDefault'
import { Content } from 'src/layout/components/Content'

// ⬇️ capabilities
import { useAccess } from 'src/app/modules/company/providers/AccessProvider'

const SurveyEditPage = () => {
    const { currentUser } = useAuth()
    const companyId = currentUser!.companyId
    const userId = currentUser!.id
    const navigate = useNavigate()
    const { surveyId } = useParams<{ surveyId: string }>()
    const [searchParams] = useSearchParams()
    const stepParam = Number(searchParams.get('step') || '1')
    const ctxSpace = searchParams.get('spaceId') || undefined
    const initialStep = stepParam >= 1 && stepParam <= 3 ? stepParam : 1
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [loading, setLoading] = useState(!!surveyId)

    const { can } = useAccess()

    useEffect(() => {
        if (!surveyId) return
        setLoading(true)
        SurveyService.getOne(companyId, surveyId)
            .then(setSurvey)
            .finally(() => setLoading(false))
    }, [companyId, surveyId])

    // 🔐 gate da página
    const isCreate = !surveyId
    const canEditHere = useMemo(() => {
        if (isCreate) {
            // criar: pode se tiver ALL_SPACES; ou se veio com spaceId permitido via query
            if (can('edit', 'surveys')) return true
            if (ctxSpace) return can('edit', 'surveys', ctxSpace)
            return false
        }
        // editar existente: precisa permissão em pelo menos um dos spaces da survey (ou ALL_SPACES)
        if (!survey) return false
        return can('edit', 'surveys') || (survey.spaceIds || []).some(id => can('edit', 'surveys', id))
    }, [isCreate, survey, can, ctxSpace])

    const formInitialValues = useMemo(() => {
        if (!surveyId) {
            const base = initialSurveyValues(companyId, userId)
            // se veio com spaceId no contexto e tem permissão nele, pré-seleciona
            if (ctxSpace && can('edit', 'surveys', ctxSpace)) {
                (base as any).spaceIds = [ctxSpace]
            }
            return base
        }
        if (!survey) return initialSurveyValues(companyId, userId)
        // mapear entity -> dto básico (sem campos proibidos)
        return {
            companyId,
            title: survey.title,
            description: survey.description ?? '',
            authorId: survey.authorId ?? userId,
            adminIds: survey.adminIds ?? [userId],
            spaceIds: survey.spaceIds ?? [],
            visibility: survey.visibility,
            notifyUsers: !!survey.notifyUsers,
            pushNotification: !!survey.pushNotification,
            pushContent: survey.pushContent ?? undefined,
            pushTitle: survey.pushTitle ?? undefined,
            acknowledgementRequired: !!survey.acknowledgementRequired,
            emailNotification: !!survey.emailNotification,
            inAppNotification: !!survey.inAppNotification,
            groupIds: survey.groupIds ?? [],
            isAnonymous: !!survey.isAnonymous,
            scheduleSurvey: !!survey.scheduleSurvey,
            expireSurvey: !!survey.expireSurvey,
            startsAt: survey.startsAt ?? new Date().toISOString(),
            endsAt: survey.endsAt ?? '',
            status: survey.status,
        }
    }, [companyId, userId, survey, surveyId, ctxSpace, can])

    const handleDone = () => {
        navigate('/modules/surveys')
    }

    if (!canEditHere) {
        return (
            <div className="app-container container-xxl">
                <div className="app-page" id="kt_app_page">
                    <AsideDefault />
                    <Content>
                        <div className="alert alert-warning">
                            Você não tem permissão para {isCreate ? 'criar' : 'editar'} enquetes neste contexto.
                        </div>
                        <button className="btn btn-light mt-4" onClick={() => navigate('/modules/surveys')}>
                            ← Voltar para a lista
                        </button>
                    </Content>
                </div>
            </div>
        )
    }

    return (
        <div className="app-container container-xxl">
            <div className="app-page" id="kt_app_page">
                <AsideDefault />
                <Content>
                    <PageTitle breadcrumbs={[]}>
                        {surveyId ? 'Editar Enquete' : 'Criar Enquete'}
                    </PageTitle>

                    {/* Botão de voltar */}
                    <div className="d-flex justify-content-between align-items-center mb-6">
                        <button
                            className="btn btn-light"
                            onClick={() => navigate('/modules/surveys')}
                            title="Voltar para a lista"
                        >
                            ← Voltar para a lista
                        </button>
                    </div>

                    {loading ? (
                        <div className="alert alert-info">Carregando...</div>
                    ) : (
                        <SurveyWizardForm
                            key={surveyId ?? 'new'}
                            companyId={companyId}
                            userId={userId}
                            surveyId={surveyId}
                            initialValues={formInitialValues}
                            initialStep={initialStep}
                            onFinished={handleDone}
                        />
                    )}
                </Content>
            </div>
        </div>
    )
}

export default SurveyEditPage