import { FC, useMemo, useState } from 'react'
import { CreateSurveyDto, Survey } from '@shared/types'
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
}

const cleanDto = (v: CreateSurveyDto): Partial<Survey> => ({
    // somente campos aceitos pelo backend
    companyId: v.companyId,
    title: v.title,
    description: v.description || '',
    authorId: v.authorId,
    adminIds: v.adminIds,
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

const SurveyWizardForm: FC<Props> = ({ companyId, userId, surveyId, initialValues, onFinished }) => {
    const [data, setData] = useState<CreateSurveyDto>(initialValues)
    const [step, setStep] = useState<number>(1)
    const [saving, setSaving] = useState(false)

    const setFieldValue = (field: keyof CreateSurveyDto, value: any) =>
        setData(prev => ({ ...prev, [field]: value }))

    const canGoQuestions = !!surveyId

    const saveStep = async () => {
        setSaving(true)
        try {
            const payload = cleanDto({ ...data, companyId, authorId: data.authorId || userId })
            if (surveyId) {
                await SurveyService.update(companyId, surveyId, payload)
            } else {
                const created = await SurveyService.create(companyId, payload)
                // após criar, vá para step 3 (perguntas)
                window.location.assign(`/modules/surveys/${created.id}/edit`)
                return
            }
            return
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

    const handleFinish = async (e: React.FormEvent) => {
        e.preventDefault()
        await saveStep()
        onFinished()
    }

    const header = useMemo(() => (
        <div className="d-flex align-items-center justify-content-between mb-6">
            <div className="btn-group" role="group" aria-label="steps">
                <button
                    type="button"
                    className={`btn ${step === 1 ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setStep(1)}
                >1</button>
                <button
                    type="button"
                    className={`btn ${step === 2 ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setStep(2)}
                >2</button>
                <button
                    type="button"
                    className={`btn ${step === 3 ? 'btn-primary' : 'btn-light'}`}
                    onClick={() => setStep(3)}
                >3</button>
            </div>

            {canGoQuestions && step !== 3 && (
                <button className="btn btn-outline-primary" onClick={() => setStep(3)}>
                    Ir para perguntas
                </button>
            )}
        </div>
    ), [step, canGoQuestions])

    return (
        <div className="card">
            <div className="card-body">
                {header}

                {/* Step 1 e 2 ficam dentro de <form>; Step 3 sem <form> */}
                {step === 1 && (
                    <form onSubmit={handleNext}>
                        <SurveyStep1Basic data={data} setFieldValue={setFieldValue as any} />
                        <div className="d-flex justify-content-end gap-2 mt-6">
                            <button className="btn btn-primary" type="submit" disabled={saving}>Continuar</button>
                        </div>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleNext}>
                        <SurveyStep2Publish data={data} setFieldValue={setFieldValue as any} />
                        <div className="d-flex justify-content-between gap-2 mt-6">
                            <button className="btn btn-light" onClick={handlePrev}>Voltar</button>
                            <div className="d-flex gap-2">
                                <button className="btn btn-light" onClick={handleFinish} disabled={saving}>Salvar</button>
                                <button className="btn btn-primary" type="submit" disabled={saving}>Continuar</button>
                            </div>
                        </div>
                    </form>
                )}

                {step === 3 && (
                    <>
                        <SurveyStep3Questions companyId={companyId} surveyId={surveyId} />
                        <div className="d-flex justify-content-between gap-2 mt-6">
                            <button className="btn btn-light" onClick={() => setStep(2)}>Voltar</button>
                            <button className="btn btn-success" onClick={() => onFinished()}>Concluir</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default SurveyWizardForm