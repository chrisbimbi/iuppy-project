import React, { useEffect, useMemo, useState } from 'react'
import { useAuth } from 'src/app/modules/auth'
import * as types from '@shared/types'
import { SurveyService } from '../../services/surveys.service'

// Steps (como você já tem prontos)
import SurveyStep1Basic from './SurveyStep1Basic'
import SurveyStep2Publish from './SurveyStep2Publish'

type Props = {
    /** Dados iniciais no formato CreateSurveyDto */
    initialValues: types.CreateSurveyDto
    /** Se vier, atualizamos a survey existente */
    editingId?: string
    onSaved: () => void
}

type Visibility = 'public' | 'private' | 'specific_groups'

/** Normaliza os valores iniciais para o estado interno (sempre strings e defaults coerentes) */
function normalizeInit(
    init: types.CreateSurveyDto,
    ctx: { companyId: string; authorId: string }
): types.CreateSurveyDto {
    const toIso = (v: string | Date | undefined | null): string => {
        if (!v) return ''
        if (typeof v === 'string') return v
        if (v instanceof Date) return v.toISOString()
        return ''
    }

    const visibility = (init.visibility as Visibility) || 'public'
    const scheduleSurvey = !!init.scheduleSurvey
    const expireSurvey = !!init.expireSurvey

    const base: types.CreateSurveyDto = {
        companyId: ctx.companyId,
        title: init.title || '',
        description: init.description || '',
        authorId: init.authorId || ctx.authorId || '',
        adminIds:
            init.adminIds && init.adminIds.length
                ? init.adminIds
                : ctx.authorId
                    ? [ctx.authorId]
                    : [],
        spaceIds: init.spaceIds || [],
        visibility,

        notifyUsers: !!init.notifyUsers,
        pushNotification: !!init.pushNotification,
        ...(init.pushNotification ? { pushTitle: init.pushTitle || '' } : {}),
        ...(init.pushNotification ? { pushContent: init.pushContent || '' } : {}),

        acknowledgementRequired: !!init.acknowledgementRequired,
        emailNotification: !!init.emailNotification,
        inAppNotification: !!init.inAppNotification,

        groupIds: visibility === 'specific_groups' ? init.groupIds || [] : [],

        isAnonymous: !!init.isAnonymous,

        scheduleSurvey,
        expireSurvey,

        startsAt: scheduleSurvey ? toIso(init.startsAt as any) : '',
        endsAt: expireSurvey ? toIso(init.endsAt as any) : '',

        status: init.status || types.SurveyStatus.Draft,
        createdAt: init.createdAt,
        updatedAt: init.updatedAt,
    }

    return base
}

/** Validação do Step 1 */
function validateStep1(form: types.CreateSurveyDto): string | null {
    if (!form.title?.trim()) return 'Informe um título.'
    if (!form.spaceIds || form.spaceIds.length === 0) return 'Selecione ao menos um espaço.'
    if (form.visibility === 'specific_groups' && (!form.groupIds || form.groupIds.length === 0)) {
        return 'Selecione pelo menos um grupo para "Grupos específicos".'
    }
    return null
}

/** Monta o payload final; remove campos não aceitos pelo backend */
function buildPayload(form: types.CreateSurveyDto): types.CreateSurveyDto {
    const toIso = (v: string | Date | undefined | null): string => {
        if (!v) return ''
        if (typeof v === 'string') return v
        if (v instanceof Date) return v.toISOString()
        return ''
    }

    // Clona e aplica coerências
    const draft: types.CreateSurveyDto = {
        ...form,
        groupIds: form.visibility === 'specific_groups' ? (form.groupIds || []) : [],
        startsAt: form.scheduleSurvey ? toIso(form.startsAt as any) : '',
        endsAt: form.expireSurvey ? toIso(form.endsAt as any) : '',
    }

    if (!draft.pushNotification) {
        delete (draft as any).pushTitle
        delete (draft as any).pushContent
    } else {
        draft.pushTitle = (draft.pushTitle || '').trim()
        draft.pushContent = (draft.pushContent || '').trim()
    }

    // Remove campos que o backend NÃO aceita em Create/Update
    const { createdAt, updatedAt, ...clean } = draft
    // Garantia extra: não enviar undefined em opcionais (classe-validator com whitelist costuma tolerar, mas evitamos ruído)
    if (!clean.pushNotification) {
        delete (clean as any).pushTitle
        delete (clean as any).pushContent
    }

    return clean
}

const SurveyWizardForm: React.FC<Props> = ({ initialValues, editingId, onSaved }) => {
    const { currentUser } = useAuth()
    const companyId = initialValues.companyId || currentUser?.companyId || ''
    const currentUserId = currentUser?.id || initialValues.authorId

    // Estado do formulário (CreateSurveyDto)
    const [form, setForm] = useState<types.CreateSurveyDto>(() =>
        normalizeInit(initialValues, { companyId, authorId: currentUserId || '' })
    )

    useEffect(() => {
        setForm(normalizeInit(initialValues, { companyId, authorId: currentUserId || '' }))
    }, [initialValues, companyId, currentUserId])

    // Controle de passos
    const [step, setStep] = useState<1 | 2>(1)

    // Evita submit implícito do <form> (Enter/Click em button sem type)
    const preventSubmit = (e: React.FormEvent) => e.preventDefault()

    // setFieldValue usado pelos steps
    const setFieldValue = (field: string, value: any) => {
        setForm(prev => {
            const next: any = { ...prev, [field]: value }

            if (field === 'visibility' && value !== 'specific_groups') {
                next.groupIds = []
            }
            if (field === 'scheduleSurvey' && !value) {
                next.startsAt = ''
            }
            if (field === 'expireSurvey' && !value) {
                next.endsAt = ''
            }
            if (field === 'pushNotification' && !value) {
                delete next.pushTitle
                delete next.pushContent
            }

            return next
        })
    }

    const canGoNext = useMemo(() => validateStep1(form) === null, [form])

    const handleNext = () => {
        const err = validateStep1(form)
        if (err) {
            alert(err)
            return
        }
        setStep(2)
    }

    const handleBack = () => setStep(1)

    const handleSave = async () => {
        // valida Step 1 antes de salvar
        const err = validateStep1(form)
        if (err) {
            alert(err)
            setStep(1)
            return
        }

        const payload = buildPayload(form)

        try {
            if (editingId) {
                await SurveyService.update(companyId, editingId, payload)
            } else {
                await SurveyService.create(companyId, payload)
            }
            onSaved()
        } catch (error) {
            console.error('Erro ao salvar survey', error)
            alert('Não foi possível salvar. Veja o console para detalhes.')
        }
    }

    return (
        <form onSubmit={preventSubmit}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="mb-0">{editingId ? 'Editar Enquete' : 'Nova Enquete'}</h5>
                <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${step === 1 ? 'badge-primary' : 'badge-light-primary'}`}>1</span>
                    <span>→</span>
                    <span className={`badge ${step === 2 ? 'badge-primary' : 'badge-light-primary'}`}>2</span>
                </div>
            </div>

            {/* Conteúdo */}
            {step === 1 && <SurveyStep1Basic data={form} setFieldValue={setFieldValue} />}
            {step === 2 && <SurveyStep2Publish data={form} setFieldValue={setFieldValue} />}

            {/* Footer */}
            <div className="d-flex justify-content-between mt-5">
                <div>
                    {step === 2 && (
                        <button type="button" className="btn btn-light" onClick={handleBack}>
                            Voltar
                        </button>
                    )}
                </div>

                <div className="d-flex gap-2">
                    {step === 1 ? (
                        <button type="button" className="btn btn-primary" onClick={handleNext} disabled={!canGoNext}>
                            Continuar
                        </button>
                    ) : (
                        <button type="button" className="btn btn-primary" onClick={handleSave}>
                            {editingId ? 'Atualizar' : 'Publicar'}
                        </button>
                    )}
                </div>
            </div>
        </form>
    )
}

export default SurveyWizardForm