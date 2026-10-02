import React from 'react'
import { assessmentDomains } from '../data/assessment'

const domainMap = Object.fromEntries(assessmentDomains.map(domain => [domain.id, domain]))

export default function PlanPanel({ progress, onStartAssessment }) {
  const assessment = progress.assessment
  const plan = assessment?.plan
  const summary = assessment?.summary

  if (!plan || assessment?.status !== 'completed') {
    return (
      <section className="plan-empty">
        <div className="plan-empty-icon">🧭</div>
        <div>
          <p className="kicker">PRIMER PASO</p>
          <h2>Construyamos la línea de base de Lautaro</h2>
          <p>La evaluación inicial no busca darle una “edad mental” ni un diagnóstico. Sirve para ubicar habilidades concretas: qué hace solo, qué consigue con ayuda y qué todavía necesita aprender.</p>
          <p className="muted">Podés hacerla en varias sesiones. Cada respuesta se guarda automáticamente.</p>
          <button className="primary" onClick={onStartAssessment}>
            {assessment?.status === 'in-progress' ? 'Continuar evaluación' : 'Comenzar evaluación'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="plan-view">
      <section className="plan-hero">
        <div>
          <p className="kicker">PLAN ACTUAL</p>
          <h2>{plan.title}</h2>
          <p>Prioridad principal: <b>{plan.primary.icon} {plan.primary.label}</b></p>
        </div>
        <button className="secondary" onClick={onStartAssessment}>Revisar evaluación</button>
      </section>

      <section className="plan-columns">
        <div className="plan-card primary-focus">
          <p className="kicker">ATACAR PRIMERO</p>
          <h3>{plan.primary.icon} {plan.primary.label}</h3>
          <div className="big-percent">{plan.primary.percent}%</div>
          <p>{plan.primary.goal}</p>
          <div className="plan-instruction">
            <b>Esta semana</b>
            <p>{plan.primary.recommendation?.weeklyGoal}</p>
          </div>
          <div className="plan-instruction">
            <b>Cada día</b>
            <p>{plan.primary.recommendation?.daily}</p>
          </div>
        </div>

        <div className="plan-card">
          <p className="kicker">FORTALEZAS RELATIVAS</p>
          {plan.strengths.map(item => (
            <div className="strength-row" key={item.id}>
              <span>{item.icon}</span>
              <div><b>{item.label}</b><small>{item.percent}% en la línea de base</small></div>
            </div>
          ))}
          <p className="muted small-copy">“Fortaleza relativa” significa que rindió mejor allí que en otras áreas de esta evaluación; no implica un techo ni una capacidad fija.</p>
        </div>
      </section>

      <section className="priority-card">
        <p className="kicker">ORDEN DE TRABAJO ACTUAL</p>
        <div className="priority-list">
          {plan.priorities.map((item, index) => (
            <div key={item.id}>
              <span className="priority-number">{index + 1}</span>
              <span className="priority-icon">{item.icon}</span>
              <div>
                <b>{item.label}</b>
                <small>{item.recommendation?.weeklyGoal}</small>
              </div>
              <em>{item.percent}%</em>
            </div>
          ))}
        </div>
      </section>

      <section className="domain-overview">
        <p className="kicker">MAPA COMPLETO</p>
        <div className="domain-grid">
          {summary.domains.map(domain => (
            <div key={domain.id}>
              <span>{domain.icon}</span>
              <b>{domain.label}</b>
              <div className="domain-meter"><i style={{ width: domain.percent + '%' }} /></div>
              <small>{domain.percent}% · {domain.stage === 'prioridad' ? 'prioridad' : domain.stage === 'en-desarrollo' ? 'en desarrollo' : 'más consolidado'}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="session-card">
        <p className="kicker">SESIÓN RECOMENDADA</p>
        <div className="timeline">
          {plan.session.map(item => (
            <div key={item.label}>
              <b>{item.minutes} min</b>
              <span><strong>{item.label}</strong><small>{item.detail}</small></span>
            </div>
          ))}
        </div>
        <div className="plan-rule"><b>Cuándo avanzar</b><p>{plan.rule}</p></div>
      </section>
    </div>
  )
}
