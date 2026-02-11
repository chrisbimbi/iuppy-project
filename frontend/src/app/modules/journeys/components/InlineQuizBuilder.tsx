import { FC, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

type QuizOption = {
    id: string
    text: string
    isCorrect: boolean
}

type QuizQuestion = {
    id: string
    title: string
    type: 'SINGLE_CHOICE' | 'MULTI_CHOICE'
    weight: number
    options: QuizOption[]
}

type QuizConfig = {
    passingScore: number
    questions: QuizQuestion[]
}

type Props = {
    value: QuizConfig
    onChange: (config: QuizConfig) => void
}

export const InlineQuizBuilder: FC<Props> = ({ value, onChange }) => {
    const config = value || { passingScore: 70, questions: [] }

    const updatePassingScore = (score: number) => {
        onChange({ ...config, passingScore: score })
    }

    const addQuestion = () => {
        const newQuestion: QuizQuestion = {
            id: uuidv4(),
            title: '',
            type: 'SINGLE_CHOICE',
            weight: 1,
            options: [
                { id: uuidv4(), text: '', isCorrect: true },
                { id: uuidv4(), text: '', isCorrect: false }
            ]
        }
        onChange({ ...config, questions: [...config.questions, newQuestion] })
    }

    const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
        const updatedQuestions = config.questions.map(q =>
            q.id === questionId ? { ...q, ...updates } : q
        )
        onChange({ ...config, questions: updatedQuestions })
    }

    const deleteQuestion = (questionId: string) => {
        onChange({ ...config, questions: config.questions.filter(q => q.id !== questionId) })
    }

    const addOption = (questionId: string) => {
        const question = config.questions.find(q => q.id === questionId)
        if (!question) return

        const newOption: QuizOption = {
            id: uuidv4(),
            text: '',
            isCorrect: false
        }
        updateQuestion(questionId, {
            options: [...question.options, newOption]
        })
    }

    const updateOption = (questionId: string, optionId: string, updates: Partial<QuizOption>) => {
        const question = config.questions.find(q => q.id === questionId)
        if (!question) return

        const updatedOptions = question.options.map(opt =>
            opt.id === optionId ? { ...opt, ...updates } : opt
        )
        updateQuestion(questionId, { options: updatedOptions })
    }

    const deleteOption = (questionId: string, optionId: string) => {
        const question = config.questions.find(q => q.id === questionId)
        if (!question) return

        updateQuestion(questionId, {
            options: question.options.filter(opt => opt.id !== optionId)
        })
    }

    const toggleCorrect = (questionId: string, optionId: string) => {
        const question = config.questions.find(q => q.id === questionId)
        if (!question) return

        if (question.type === 'SINGLE_CHOICE') {
            // For single choice, only one can be correct
            const updatedOptions = question.options.map(opt => ({
                ...opt,
                isCorrect: opt.id === optionId
            }))
            updateQuestion(questionId, { options: updatedOptions })
        } else {
            // For multi choice, toggle the clicked option
            const updatedOptions = question.options.map(opt =>
                opt.id === optionId ? { ...opt, isCorrect: !opt.isCorrect } : opt
            )
            updateQuestion(questionId, { options: updatedOptions })
        }
    }

    return (
        <div className="quiz-builder">
            {/* Passing Score */}
            <div className="mb-6">
                <label className="form-label fw-bold">Nota Mínima para Aprovação (%)</label>
                <input
                    type="number"
                    className="form-control form-control-solid"
                    min={0}
                    max={100}
                    value={config.passingScore}
                    onChange={(e) => updatePassingScore(parseInt(e.target.value) || 0)}
                />
                <div className="form-text text-muted">
                    Colaborador precisa acertar pelo menos {config.passingScore}% para passar
                </div>
            </div>

            {/* Questions List */}
            <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Perguntas</h5>
                    <button
                        type="button"
                        className="btn btn-sm btn-light-primary"
                        onClick={addQuestion}
                    >
                        <i className="bi bi-plus-lg me-1"></i> Adicionar Pergunta
                    </button>
                </div>

                {config.questions.length === 0 && (
                    <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Nenhuma pergunta adicionada. Clique em "Adicionar Pergunta" para começar.
                    </div>
                )}

                {config.questions.map((question, qIndex) => (
                    <div key={question.id} className="card mb-4">
                        <div className="card-header bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0">Pergunta {qIndex + 1}</h6>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-icon btn-light-danger"
                                    onClick={() => deleteQuestion(question.id)}
                                >
                                    <i className="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {/* Question Title */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">Texto da Pergunta</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Ex: Qual o EPI correto para esta atividade?"
                                    value={question.title}
                                    onChange={(e) => updateQuestion(question.id, { title: e.target.value })}
                                />
                            </div>

                            {/* Question Type & Weight */}
                            <div className="row mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Tipo</label>
                                    <select
                                        className="form-select"
                                        value={question.type}
                                        onChange={(e) =>
                                            updateQuestion(question.id, {
                                                type: e.target.value as 'SINGLE_CHOICE' | 'MULTI_CHOICE'
                                            })
                                        }
                                    >
                                        <option value="SINGLE_CHOICE">Única Escolha</option>
                                        <option value="MULTI_CHOICE">Múltipla Escolha</option>
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Peso</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min={1}
                                        value={question.weight}
                                        onChange={(e) =>
                                            updateQuestion(question.id, { weight: parseInt(e.target.value) || 1 })
                                        }
                                    />
                                    <div className="form-text text-muted">Peso na nota final</div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="mb-2">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-label fw-bold mb-0">Opções de Resposta</label>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light-success"
                                        onClick={() => addOption(question.id)}
                                    >
                                        <i className="bi bi-plus me-1"></i> Opção
                                    </button>
                                </div>

                                {question.options.map((option, oIndex) => (
                                    <div key={option.id} className="d-flex align-items-center mb-2">
                                        <div className="form-check me-3">
                                            <input
                                                className="form-check-input"
                                                type={question.type === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                                name={`question-${question.id}`}
                                                checked={option.isCorrect}
                                                onChange={() => toggleCorrect(question.id, option.id)}
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm me-2"
                                            placeholder={`Opção ${oIndex + 1}`}
                                            value={option.text}
                                            onChange={(e) =>
                                                updateOption(question.id, option.id, { text: e.target.value })
                                            }
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-icon btn-light-danger"
                                            onClick={() => deleteOption(question.id, option.id)}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    </div>
                                ))}

                                <div className="form-text text-muted mt-2">
                                    {question.type === 'SINGLE_CHOICE'
                                        ? 'Marque a opção correta'
                                        : 'Marque todas as opções corretas'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
