import React from 'react'

type Step = { key: string; title: string }

export default function StepHeader({
  steps,
  currentKey,
  onStepClick,
}: {
  steps: Step[]
  currentKey: string
  onStepClick?: (key: string) => void
}) {
  const idx = steps.findIndex((s) => s.key === currentKey)
  return (
    <div className="mb-5">
      <ol className="breadcrumb breadcrumb-dot fw-semibold">
        {steps.map((s, i) => {
          const done = i < idx
          const active = i === idx
          return (
            <li key={s.key} className={`breadcrumb-item ${active ? 'text-primary' : done ? 'text-muted' : ''}`}>
              <button
                type="button" /* evita submit/reset acidental */
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-light'} me-2`}
                onClick={() => onStepClick?.(s.key)}
              >
                {i + 1}
              </button>
              <span role="button" onClick={() => onStepClick?.(s.key)}>{s.title}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}