import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CreateSurveyQuestionDto, SurveyQuestion, SurveyQuestionType } from '@shared/types'

type Props = {
  isOpen: boolean
  initial?: SurveyQuestion
  onSubmit: (payload: Omit<CreateSurveyQuestionDto, 'order'>, id?: string) => void
  onClose: () => void
}

const DEFAULT_TYPE: SurveyQuestionType = SurveyQuestionType.Text

const QuestionForm: FC<Props> = ({ isOpen, initial, onSubmit, onClose }) => {
  const [type, setType] = useState<SurveyQuestionType>(DEFAULT_TYPE)
  const [questionText, setQuestionText] = useState('')
  const [description, setDescription] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [shuffleOptions, setShuffleOptions] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (initial) {
      setType(initial.type)
      setQuestionText(initial.questionText ?? '')
      setDescription(initial.description ?? '')
      setIsRequired(!!initial.isRequired)
      setShuffleOptions(!!initial.shuffleOptions)
      setOptions(initial.options ?? [])
    } else {
      setType(DEFAULT_TYPE)
      setQuestionText('')
      setDescription('')
      setIsRequired(true)
      setShuffleOptions(false)
      setOptions([])
    }
    setTimeout(() => firstInputRef.current?.focus(), 0)
  }, [isOpen, initial])

  const needsOptions = useMemo(() => type === 'single' || type === 'multi', [type])

  const addOption = () => setOptions(prev => [...prev, ''])
  const removeOption = (idx: number) => setOptions(prev => prev.filter((_, i) => i !== idx))
  const changeOption = (idx: number, val: string) =>
    setOptions(prev => prev.map((v, i) => (i === idx ? val : v)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!questionText.trim()) {
      alert('Informe o enunciado da pergunta.')
      return
    }
    if (needsOptions) {
      const clean = options.map(o => o.trim()).filter(Boolean)
      if (clean.length < 2) {
        alert('Informe pelo menos duas opções.')
        return
      }
    }

    const payload: Omit<CreateSurveyQuestionDto, 'order'> = {
      type,
      questionText: questionText.trim(),
      description: description.trim() || undefined,
      isRequired,
      shuffleOptions: needsOptions ? !!shuffleOptions : false,
      options: needsOptions ? options.map(o => o.trim()).filter(Boolean) : undefined,
    }

    onSubmit(payload, initial?.id)
  }

  if (!isOpen) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1085,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div
        onClick={onClose as any}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
      />
      <div
        className="card shadow"
        style={{ position: 'relative', width: 'min(640px,95vw)', zIndex: 1086 }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="card-header">
          <h5 className="mb-0">{initial ? 'Editar Pergunta' : 'Nova Pergunta'}</h5>
        </div>

        <form onSubmit={handleSubmit} onKeyDownCapture={e => e.stopPropagation()}>
          <div className="card-body">
            <div className="mb-4">
              <label className="form-label">Tipo</label>
              <select
                className="form-select"
                value={type}
                onChange={e => setType(e.target.value as SurveyQuestionType)}
              >
                <option value="text">Texto (aberta)</option>
                <option value="single">Única escolha</option>
                <option value="multi">Múltipla escolha</option>
                <option value="stars">Estrelas (1–5)</option>
                <option value="scale">Escala (1–10)</option>
                <option value="nps">NPS (0–10)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label">Enunciado</label>
              <input
                ref={firstInputRef}
                className="form-control"
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Descrição (opcional)</label>
              <textarea
                className="form-control"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="form-check mb-4">
              <input
                id="qreq"
                type="checkbox"
                className="form-check-input"
                checked={isRequired}
                onChange={e => setIsRequired(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="qreq">Resposta obrigatória</label>
            </div>

            {(type === 'single' || type === 'multi') && (
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">Opções</label>
                  <button type="button" className="btn btn-light btn-sm" onClick={addOption}>
                    + Adicionar opção
                  </button>
                </div>

                {options.length === 0 && (
                  <div className="text-muted small">Adicione pelo menos duas opções.</div>
                )}

                {options.map((opt, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-2 mb-2">
                    <input
                      className="form-control"
                      value={opt}
                      onChange={e => changeOption(idx, e.target.value)}
                      placeholder={`Opção ${idx + 1}`}
                    />
                    <button
                      type="button"
                      className="btn btn-light-danger btn-sm"
                      onClick={() => removeOption(idx)}
                    >
                      Remover
                    </button>
                  </div>
                ))}

                <div className="form-check mt-2">
                  <input
                    id="shuffle"
                    type="checkbox"
                    className="form-check-input"
                    checked={shuffleOptions}
                    onChange={e => setShuffleOptions(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="shuffle">Embaralhar opções</label>
                </div>
              </div>
            )}
          </div>

          <div className="card-footer d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-light" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default QuestionForm