import React, { useMemo, useState } from 'react'
import { assessmentDomains, assessmentItems, ratingOptions } from '../data/assessment'
import { buildAssessmentSummary, buildPersonalPlan } from '../services/planEngine'

export default function AssessmentFlow({ progress, onChange, onClose, onComplete }) {
  const saved = progress.assessment || {}
  const initialAnswers = saved.answers || {}
  const firstPending = Math.max(0, assessmentItems.findIndex(item => typeof initialAnswers[item.id] !== 'number'))
  const [index, setIndex] = useState(firstPending === -1 ? 0 : firstPending)
  const answers = saved.answers || {}
  const item = assessmentItems[index]
  const domain = assessmentDomains.find(d => d.id === item.domain)
  const answeredCount = Object.keys(answers).filter(key => typeof answers[key] === 'number').length
  const percent = Math.round((answeredCount / assessmentItems.length) * 100)

  const summary = useMemo(() => buildAssessmentSummary(answers), [answers])

  const choose = (value) => {
    const nextAssessment = {
      ...saved,
      status: 'in-progress',
      startedAt: saved.startedAt || new Date().toISOString(),
      answers: { ...answers, [item.id]: value },
      currentItem: item.id,
    }
    onChange({ ...progress, assessment: nextAssessment })

    if (index < assessmentItems.length - 1) {
      setIndex(index + 1)
    }
  }

  const finish = () => {
    const finalSummary = buildAssessmentSummary(answers)
    const plan = buildPersonalPlan(finalSummary)
    const next = {
      ...progress,
      currentSkill: finalSummary.currentSkill,
      assessment: {
        ...saved,
        status: 'completed',
        answers,
        completedAt: new Date().toISOString(),
        summary: finalSummary,
        plan,
      },
    }
    onComplete(next)
  }

  const goTo = (newIndex) => {
    if (newIndex >= 0 && newIndex < assessmentItems.length) setIndex(newIndex)
  }

  return (
    <div className="assessment-overlay">
      <div className="assessment-shell">
        <header className="assessment-header">
          <button className="ghost" onClick={onClose}>← Guardar y salir</button>
          <div className="assessment-progress">
            <div><b>Evaluación inicial guiada</b><small>{answeredCount} de {assessmentItems.length}</small></div>
            <div className="assessment-bar"><span style={{ width: percent + '%' }} /></div>
          </div>
        </header>

        <main className="assessment-main">
          <aside className="assessment-map">
            <p className="kicker">MAPA</p>
            {assessmentDomains.map(d => {
              const items = assessmentItems.filter(i => i.domain === d.id)
              const done = items.filter(i => typeof answers[i.id] === 'number').length
              return (
                <div className={d.id === item.domain ? 'active' : ''} key={d.id}>
                  <span>{d.icon}</span>
                  <b>{d.label}</b>
                  <small>{done}/{items.length}</small>
                </div>
              )
            })}
          </aside>

          <section className="assessment-card">
            <div className="assessment-domain"><span>{domain.icon}</span>{domain.label}</div>
            <p className="kicker">PASO {index + 1} DE {assessmentItems.length}</p>
            <h2>{item.title}</h2>
            <div className="assessment-prompt">{item.prompt}</div>
            <div className="observe-note"><b>Qué mirar</b><p>{item.observe}</p></div>

            <div className="rating-grid">
              {ratingOptions.map(option => (
                <button
                  key={option.value}
                  className={answers[item.id] === option.value ? 'selected' : ''}
                  onClick={() => choose(option.value)}
                >
                  <span>{option.icon}</span>
                  <b>{option.label}</b>
                  <small>{option.help}</small>
                </button>
              ))}
            </div>

            <div className="assessment-nav">
              <button className="secondary" disabled={index === 0} onClick={() => goTo(index - 1)}>← Anterior</button>
              {index < assessmentItems.length - 1
                ? <button className="secondary" onClick={() => goTo(index + 1)}>Siguiente →</button>
                : <button className="primary" disabled={!summary.complete} onClick={finish}>Generar plan</button>
              }
            </div>

            {index === assessmentItems.length - 1 && !summary.complete && (
              <p className="assessment-warning">Todavía quedan pasos sin responder. Podés volver tocando “Anterior” o guardar y continuar otro día.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
