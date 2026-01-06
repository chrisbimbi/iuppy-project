// (Copie o código abaixo)
import { FC, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { CreateSurveyDto, Survey, SurveyStatus } from '@shared/types'
import { SurveyService } from '../../services/surveys.service'
import SurveyStep1Basic from './SurveyStep1Basic'
import SurveyStep2Publish from './SurveyStep2Publish'
import SurveyStep3Questions from './SurveyStep3Questions'

type Props = {
    companyId: string
    userId: string
    surveyId?: string
    initialValues: CreateSurveyDto
    onFinished: () => void
    initialStep?: number
}

const cleanDto = (v: CreateSurveyDto): Partial<Survey> => ({
    companyId: v.companyId,
    title: v.title,
    description: v.description || '',
    authorId: v.authorId,
    adminIds: v.adminIds || [v.authorId],
    spaceIds: v.spaceIds,
    visibility: v.visibility,
    notifyUsers: !!v.notifyUsers,
    pushNotification: !!v.pushNotification,
    pushContent: v.pushContent || undefined,
    pushTitle: v.pushTitle || undefined,
    acknowledgementRequired: !!v.acknowledgementRequired,
    emailNotification: !!v.emailNotification,
    inAppNotification: !!v.inAppNotification,
    groupIds: v.groupIds || [],
    isAnonymous: !!v.isAnonymous,
    scheduleSurvey: !!v.scheduleSurvey,
    expireSurvey: !!v.expireSurvey,
    startsAt: v.startsAt,
    endsAt: v.endsAt,
    status: v.status,
})

const clampStep = (n: number) => Math.min(3, Math.max(1, Math.floor(n || 1)))

const SurveyWizardForm: FC<Props> = ({
    companyId,
    userId,
    surveyId,
    initialValues,
    onFinished,
    initialStep = 1,
}) => {
    const [data, setData] = useState<CreateSurveyDto>(initialValues)
    const [step, setStep] = useState<number>(clampStep(initialStep))
    const [saving, setSaving] = useState(false)
    const intl = useIntl()

    useEffect(() => {
        setStep(clampStep(initialStep))
    }, [initialStep, surveyId])

    const setFieldValue = (field: keyof CreateSurveyDto, value: any) =>
        setData(prev => ({ ...prev, [field]: value }))

    const canGoQuestions = !!surveyId

    const saveStep = async (forcePublish = false) => {
        setSaving(true)
        try {
            // 🔥 GARANTIA: Se for publicar, força o status E mantém os campos de push
            const finalData = { ...data };
            if (forcePublish) {
                finalData.status = SurveyStatus.Published;
            }

            const payload = cleanDto(finalData);

            // Debug para garantir que o front está mandando
            console.log('[Wizard] Payload:', payload);

            if (!payload.spaceIds?.length) {
                alert(intl.formatMessage({ id: 'SURVEYS.WIZARD.ERROR.NO_SPACE', defaultMessage: 'Selecione pelo menos 1 espaço' }))
                return false
            }

            if (surveyId) {
                await SurveyService.update(companyId, surveyId, payload)
            } else {
                const created = await SurveyService.create(companyId, payload)
                if (!forcePublish) {
                    window.location.assign(`/modules/surveys/${created.id}/edit?step=2`)
                }
                return true
            }
            return true
        } finally {
            setSaving(false)
        }
    }

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault()
        await saveStep()
        setStep(prev => Math.min(prev + 1, 3))
    }

    const handlePrev = (e?: React.FormEvent) => {
        e?.preventDefault()
        setStep(prev => Math.max(prev - 1, 1))
    }

    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault()
        await saveStep()
        onFinished()
    }

    const handlePublishAndFinish = async () => {
        const ok = await saveStep(true);
        if (ok) onFinished();
    }

    const header = useMemo(
        () => (
            <div className="d-flex align-items-center justify-content-between mb-6">
                <div className="btn-group" role="group" aria-label="steps">
                    <button type="button" className={`btn ${step === 1 ? 'btn-primary' : 'btn-light'}`} onClick={() => setStep(1)}>1</button>
                    <button type="button" className={`btn ${step === 2 ? 'btn-primary' : 'btn-light'} `} onClick={() => setStep(2)} disabled={!surveyId}>2</button>
                    <button type="button" className={`btn ${step === 3 ? 'btn-primary' : 'btn-light'}`} onClick={() => setStep(3)} disabled={!surveyId}>3</button>
                </div>
            </div>
        ),
        [step, surveyId],
    )

    return (
        <div className="card">
            <div className="card-body">
                {header}

                {step === 1 && (
                    <form onSubmit={handleNext}>
                        <SurveyStep1Basic data={data} setFieldValue={setFieldValue as any} />
                        <div className="d-flex justify-content-end gap-2 mt-6">
                            <button className="btn btn-primary" type="submit" disabled={saving}>
                                {intl.formatMessage({ id: 'SURVEYS.WIZARD.BUTTON.CONTINUE', defaultMessage: 'Continuar' })}
                            </button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleNext}>
                        <SurveyStep2Publish data={data} setFieldValue={setFieldValue as any} />
                        <div className="d-flex justify-content-between gap-2 mt-6">
                            <button className="btn btn-light" onClick={handlePrev}>
                                {intl.formatMessage({ id: 'SURVEYS.WIZARD.BUTTON.BACK', defaultMessage: 'Voltar' })}
                            </button>
                            <div className="d-flex gap-2">
                                <button className="btn btn-light" onClick={handleSaveDraft} disabled={saving}>
                                    {intl.formatMessage({ id: 'SURVEYS.WIZARD.BUTTON.SAVE_DRAFT', defaultMessage: 'Salvar Rascunho' })}
                                </button>
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {intl.formatMessage({ id: 'SURVEYS.WIZARD.BUTTON.CONTINUE', defaultMessage: 'Continuar' })}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <>
                        <SurveyStep3Questions companyId={companyId} surveyId={surveyId} />
                        <div className="d-flex justify-content-between gap-2 mt-6">
                            <button className="btn btn-light" onClick={() => setStep(2)}>
                                {intl.formatMessage({ id: 'SURVEYS.WIZARD.BUTTON.BACK', defaultMessage: 'Voltar' })}
                            </button>
                            <div className="d-flex gap-2">
                                <button className="btn btn-light" onClick={() => onFinished()}>
                                    {intl.formatMessage({ id: 'SURVEYS.WIZARD.BUTTON.EXIT_DRAFT', defaultMessage: 'Sair (Manter Rascunho)' })}
                                </button>
                                <button className="btn btn-success" onClick={handlePublishAndFinish} disabled={saving}>
                                    {intl.formatMessage({ id: 'SURVEYS.WIZARD.BUTTON.PUBLISH', defaultMessage: '🚀 Publicar Agora' })}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default SurveyWizardForm