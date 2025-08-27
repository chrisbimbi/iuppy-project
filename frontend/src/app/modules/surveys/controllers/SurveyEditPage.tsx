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

const SurveyEditPage = () => {
    const { currentUser } = useAuth()
    const companyId = currentUser!.companyId
    const userId = currentUser!.id
    const navigate = useNavigate()
    const { surveyId } = useParams<{ surveyId: string }>()
    const [searchParams] = useSearchParams()
    const stepParam = Number(searchParams.get('step') || '1')
    const initialStep = stepParam >= 1 && stepParam <= 3 ? stepParam : 1
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [loading, setLoading] = useState(!!surveyId)

    useEffect(() => {
        if (!surveyId) return
        setLoading(true)
        SurveyService.getOne(companyId, surveyId)
            .then(setSurvey)
            .finally(() => setLoading(false))
    }, [companyId, surveyId])

    const formInitialValues = useMemo(() => {
        if (!surveyId) return initialSurveyValues(companyId, userId)
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
    }, [companyId, userId, survey, surveyId])

    const handleDone = () => {
        navigate('/modules/surveys')
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