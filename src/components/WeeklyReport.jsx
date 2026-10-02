import React, { useMemo } from 'react'

function since(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

export default function WeeklyReport({ progress, vocabularySummary }) {
  const report = useMemo(() => {
    const cutoff = since(7)
    const events = (progress.events || []).filter(event => new Date(event.at) >= cutoff)
    const sessions = (progress.sessions || []).filter(session => new Date(session.completedAt) >= cutoff)
    const correct = events.filter(event => event.correct).length
    const accuracy = events.length ? Math.round((correct / events.length) * 100) : 0

    const bySkill = {}
    events.forEach(event => {
      if (!bySkill[event.skillId]) bySkill[event.skillId] = { attempts: 0, correct: 0 }
      bySkill[event.skillId].attempts += 1
      bySkill[event.skillId].correct += event.correct ? 1 : 0
    })

    const skills = Object.entries(bySkill)
      .map(([id, stat]) => ({
        id,
        attempts: stat.attempts,
        percent: Math.round((stat.correct / stat.attempts) * 100),
      }))
      .sort((a,b) => b.attempts - a.attempts)

    return { events, sessions, accuracy, skills }
  }, [progress.events, progress.sessions])

  return (
    <div className="weekly-report">
      <section className="report-hero">
        <div>
          <p className="kicker">ÚLTIMOS 7 DÍAS</p>
          <h2>Resumen semanal</h2>
          <p>Sirve para mirar tendencia, no para etiquetar capacidades.</p>
        </div>
        <div className="report-main-number">
          <b>{report.sessions.length}</b>
          <small>sesiones completas</small>
        </div>
      </section>

      <div className="report-stats">
        <div><b>{report.events.length}</b><small>respuestas registradas</small></div>
        <div><b>{report.accuracy}%</b><small>aciertos globales</small></div>
        <div><b>{vocabularySummary?.mastered || 0}</b><small>palabras dominadas</small></div>
        <div><b>Nivel {vocabularySummary?.tier || 1}</b><small>vocabulario habilitado</small></div>
      </div>

      <section className="report-card">
        <h3>Qué conviene hacer ahora</h3>
        {report.events.length === 0 ? (
          <p className="muted">Todavía no hay suficiente actividad esta semana. Con 3–5 sesiones cortas ya vamos a empezar a ver tendencias útiles.</p>
        ) : (
          <>
            <p>{report.accuracy >= 80 ? 'El rendimiento general está estable. Mantendría repasos y dejaría que la app introduzca palabras nuevas gradualmente.' : 'Todavía conviene sostener el nivel actual y reforzar antes de sumar demasiadas novedades.'}</p>
            <p className="muted">La app prioriza automáticamente palabras con dificultad y reduce la frecuencia de las ya dominadas.</p>
          </>
        )}
      </section>

      {report.skills.length > 0 && (
        <section className="report-card">
          <h3>Áreas practicadas</h3>
          <div className="report-skill-list">
            {report.skills.map(skill => (
              <div key={skill.id}>
                <b>{skill.id}</b>
                <span>{skill.attempts} intentos</span>
                <em>{skill.percent}%</em>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
