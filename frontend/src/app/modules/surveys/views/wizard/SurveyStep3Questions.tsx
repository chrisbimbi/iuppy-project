import { FC, useEffect, useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { Survey, SurveyQuestion, CreateSurveyQuestionDto } from '@shared/types'
import { SurveyService } from '../../services/surveys.service'
import QuestionForm from '../questions/QuestionForm'

type Props = { companyId: string; surveyId?: string }

const SurveyStep3Questions: FC<Props> = ({ companyId, surveyId }) => {
    const [survey, setSurvey] = useState<Survey | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const intl = useIntl()

    const [showForm, setShowForm] = useState(false)
    const [editing, setEditing] = useState<SurveyQuestion | null>(null)
    const [dragId, setDragId] = useState<string | null>(null)
    const [dirtyOrder, setDirtyOrder] = useState(false)

    const questions = useMemo(
        () => (survey?.questions ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        [survey]
    )

    useEffect(() => {
        if (!companyId || !surveyId) return
        setLoading(true)
        SurveyService.getOne(companyId, surveyId)
            .then(setSurvey)
            .catch(e => setError(e?.message ?? intl.formatMessage({ id: 'SURVEYS.STEP3.ERROR.LOAD', defaultMessage: 'Erro ao carregar perguntas' })))
            .finally(() => setLoading(false))
    }, [companyId, surveyId])

    const openCreate = () => { setEditing(null); setShowForm(true) }
    const openEdit = (q: SurveyQuestion) => { setEditing(q); setShowForm(true) }

    const handleDelete = async (q: SurveyQuestion) => {
        if (!surveyId) return
        if (!confirm(intl.formatMessage({ id: 'SURVEYS.STEP3.CONFIRM.DELETE', defaultMessage: 'Remover esta pergunta?' }))) return
        try {
            await SurveyService.removeQuestion(companyId, q.id)
            setSurvey(prev => prev ? { ...prev, questions: prev.questions.filter(x => x.id !== q.id) } : prev)
        } catch (e) {
            alert(intl.formatMessage({ id: 'SURVEYS.STEP3.ERROR.DELETE', defaultMessage: 'Não foi possível remover a pergunta.' }))
            console.error(e)
        }
    }

    const handleSave = async (payloadBase: Omit<CreateSurveyQuestionDto, 'order'>, id?: string) => {
        if (!surveyId) return
        const autoOrder = id ? (questions.find(q => q.id === id)?.order ?? 1) : (questions.length + 1)
        const payload: CreateSurveyQuestionDto = { ...payloadBase, order: autoOrder }

        try {
            if (id) {
                const updated = await SurveyService.updateQuestion(companyId, id, payload)
                setSurvey(prev =>
                    prev ? { ...prev, questions: prev.questions.map(q => (q.id === id ? { ...updated } : q)) } : prev
                )
            } else {
                const created = await SurveyService.addQuestion(companyId, surveyId, payload)
                setSurvey(prev => (prev ? { ...prev, questions: [...prev.questions, created] } : prev))
            }
            setShowForm(false)
            setEditing(null)
        } catch (e) {
            alert(intl.formatMessage({ id: 'SURVEYS.STEP3.ERROR.SAVE', defaultMessage: 'Não foi possível salvar a pergunta.' }))
            console.error(e)
        }
    }

    const onDragStart = (id: string) => () => setDragId(id)
    const onDragOver = (e: React.DragEvent<HTMLTableRowElement>) => { e.preventDefault() }
    const move = (arr: any[], from: number, to: number) => {
        const copy = arr.slice()
        const [item] = copy.splice(from, 1)
        copy.splice(to, 0, item)
        return copy
    }
    const onDrop = (overId: string) => (e: React.DragEvent<HTMLTableRowElement>) => {
        e.preventDefault()
        if (!dragId || dragId === overId) return
        const list = questions
        const from = list.findIndex(q => q.id === dragId)
        const to = list.findIndex(q => q.id === overId)
        if (from < 0 || to < 0) return

        const newList = move(list, from, to).map((q, i) => ({ ...q, order: i + 1 }))
        setDirtyOrder(true)
        setSurvey(prev => (prev ? { ...prev, questions: newList } : prev))
        setDragId(null)
    }

    const saveOrder = async () => {
        if (!surveyId || !survey) return
        try {
            await SurveyService.reorderQuestions(
                companyId,
                surveyId,
                survey.questions.slice().sort((a, b) => a.order - b.order).map(q => ({ id: q.id, order: q.order }))
            )
            setDirtyOrder(false)
        } catch (e) {
            alert(intl.formatMessage({ id: 'SURVEYS.STEP3.ERROR.ORDER', defaultMessage: 'Não foi possível salvar a nova ordem.' }))
            console.error(e)
        }
    }

    const typeLabel = (t: SurveyQuestion['type']) =>
    ({
        text: intl.formatMessage({ id: 'SURVEYS.STEP3.TYPE.TEXT', defaultMessage: 'Texto' }),
        single: intl.formatMessage({ id: 'SURVEYS.STEP3.TYPE.SINGLE', defaultMessage: 'Única' }),
        multi: intl.formatMessage({ id: 'SURVEYS.STEP3.TYPE.MULTI', defaultMessage: 'Múltipla' }),
        stars: intl.formatMessage({ id: 'SURVEYS.STEP3.TYPE.STARS', defaultMessage: 'Estrelas' }),
        scale: intl.formatMessage({ id: 'SURVEYS.STEP3.TYPE.SCALE', defaultMessage: 'Escala' }),
        nps: intl.formatMessage({ id: 'SURVEYS.STEP3.TYPE.NPS', defaultMessage: 'NPS' })
    }[t])

    return (
        <div>
            <div className="pb-8 d-flex justify-content-between align-items-end">
                <div>
                    <h3 className="fw-bold text-dark">{intl.formatMessage({ id: 'SURVEYS.STEP3.TITLE', defaultMessage: 'Perguntas' })}</h3>
                    <div className="text-muted">{intl.formatMessage({ id: 'SURVEYS.STEP3.SUBTITLE', defaultMessage: 'Arraste para reordenar. As alterações de ordem precisam ser salvas.' })}</div>
                </div>
                <div className="d-flex gap-2">
                    {dirtyOrder && (
                        <button className="btn btn-success" onClick={saveOrder}>
                            {intl.formatMessage({ id: 'SURVEYS.STEP3.BUTTON.SAVE_ORDER', defaultMessage: 'Salvar ordem' })}
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={openCreate} disabled={!surveyId}>
                        {intl.formatMessage({ id: 'SURVEYS.STEP3.BUTTON.NEW', defaultMessage: '+ Nova Pergunta' })}
                    </button>
                </div>
            </div>

            {loading && <div className="alert alert-info">{intl.formatMessage({ id: 'SURVEYS.STEP3.STATE.LOADING', defaultMessage: 'Carregando...' })}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {(questions.length === 0 && !loading) && (
                <div className="alert alert-warning">{intl.formatMessage({ id: 'SURVEYS.STEP3.STATE.EMPTY', defaultMessage: 'Nenhuma pergunta ainda.' })}</div>
            )}

            {questions.length > 0 && (
                <div className="table-responsive">
                    <table className="table align-middle">
                        <thead>
                            <tr>
                                <th style={{ width: 60 }} />
                                <th style={{ width: 80 }}>{intl.formatMessage({ id: 'SURVEYS.STEP3.HEADER.ORDER', defaultMessage: 'Ordem' })}</th>
                                <th style={{ width: 120 }}>{intl.formatMessage({ id: 'SURVEYS.STEP3.HEADER.TYPE', defaultMessage: 'Tipo' })}</th>
                                <th>{intl.formatMessage({ id: 'SURVEYS.STEP3.HEADER.TEXT', defaultMessage: 'Enunciado' })}</th>
                                <th style={{ width: 160 }} />
                            </tr>
                        </thead>
                        <tbody>
                            {questions.map((q) => (
                                <tr
                                    key={q.id}
                                    draggable
                                    onDragStart={onDragStart(q.id)}
                                    onDragOver={onDragOver}
                                    onDrop={onDrop(q.id)}
                                    style={{ cursor: 'grab' }}
                                >
                                    <td className="text-muted">☰</td>
                                    <td>{q.order}</td>
                                    <td>{typeLabel(q.type)}</td>
                                    <td>
                                        <div className="fw-semibold">{q.questionText}</div>
                                        {q.description && <div className="text-muted small">{q.description}</div>}
                                    </td>
                                    <td className="text-end">
                                        <button className="btn btn-light btn-sm me-2" onClick={() => openEdit(q)}>
                                            {intl.formatMessage({ id: 'SURVEYS.STEP3.ACTION.EDIT', defaultMessage: 'Editar' })}
                                        </button>
                                        <button className="btn btn-light-danger btn-sm" onClick={() => handleDelete(q)}>
                                            {intl.formatMessage({ id: 'SURVEYS.STEP3.ACTION.REMOVE', defaultMessage: 'Remover' })}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <QuestionForm
                    isOpen={showForm}
                    initial={editing || undefined}
                    onClose={() => { setShowForm(false); setEditing(null) }}
                    onSubmit={handleSave}
                />
            )}
        </div>
    )
}

export default SurveyStep3Questions