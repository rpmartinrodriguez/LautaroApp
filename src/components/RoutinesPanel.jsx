import React from 'react'
import { routineTemplates } from '../data/routines'

export default function RoutinesPanel({ progress, onStart }) {
  const stats = progress.routineStats || {}

  return (
    <div className="routines-panel">
      <section className="guide-callout">
        <div>🧭</div>
        <div>
          <p className="kicker">AUTONOMÍA</p>
          <h3>Una rutina, muchos días</h3>
          <p>Conviene repetir la misma secuencia hasta que necesite menos ayuda. Después se pueden retirar apoyos paso a paso.</p>
        </div>
      </section>

      <div className="routine-grid">
        {routineTemplates.map(routine => {
          const stat = stats[routine.id] || { completions: 0 }
          return (
            <article key={routine.id} className="routine-card">
              <div className="routine-card-icon">{routine.icon}</div>
              <div>
                <h3>{routine.title}</h3>
                <p>{routine.steps.length} pasos</p>
                <small>{stat.completions || 0} veces completada</small>
              </div>
              <button className="secondary" onClick={() => onStart(routine)}>Practicar</button>
            </article>
          )
        })}
      </div>
    </div>
  )
}
