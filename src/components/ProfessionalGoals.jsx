import React, { useState } from 'react'

const areas = [
  'Comunicación',
  'Pronunciación',
  'Lectura',
  'Escritura',
  'Comprensión',
  'Matemática',
  'Memoria / atención',
  'Autonomía',
]

export default function ProfessionalGoals({ progress, onChange }) {
  const goals = progress.professionalGoals || []
  const [area, setArea] = useState('Comunicación')
  const [text, setText] = useState('')
  const [professional, setProfessional] = useState('')

  const add = event => {
    event.preventDefault()
    if (!text.trim()) return

    const goal = {
      id: crypto.randomUUID(),
      area,
      text: text.trim(),
      professional: professional.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      completedAt: null,
    }

    onChange({
      ...progress,
      professionalGoals: [...goals, goal],
    })
    setText('')
  }

  const toggle = goal => {
    onChange({
      ...progress,
      professionalGoals: goals.map(item => item.id === goal.id
        ? {
            ...item,
            active: !item.active,
            completedAt: item.active ? new Date().toISOString() : null,
          }
        : item),
    })
  }

  const remove = goal => {
    if (!confirm('¿Eliminar este objetivo?')) return
    onChange({
      ...progress,
      professionalGoals: goals.filter(item => item.id !== goal.id),
    })
  }

  const active = goals.filter(goal => goal.active)
  const completed = goals.filter(goal => !goal.active)

  return (
    <div className="goals-panel">
      <section className="goals-builder">
        <p className="kicker">EQUIPO PROFESIONAL</p>
        <h2>Objetivos compartidos</h2>
        <p className="muted">Podés copiar aquí lo que indique la fonoaudióloga, psicopedagoga, terapeuta ocupacional u otro profesional para que el trabajo de casa vaya en la misma dirección.</p>

        <form onSubmit={add}>
          <select value={area} onChange={e => setArea(e.target.value)}>
            {areas.map(item => <option key={item}>{item}</option>)}
          </select>
          <input value={professional} onChange={e => setProfessional(e.target.value)} placeholder="Profesional (opcional)" />
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Ej: trabajar palabras bisílabas que empiecen con M y P" rows={4} />
          <button className="primary">Agregar objetivo</button>
        </form>
      </section>

      <section className="goals-list">
        <h3>Objetivos activos</h3>
        {active.length === 0 ? <p className="muted">No hay objetivos profesionales activos.</p> : active.map(goal => (
          <article key={goal.id}>
            <div className="goal-area">{goal.area}</div>
            <h4>{goal.text}</h4>
            {goal.professional && <p>{goal.professional}</p>}
            <div className="goal-actions">
              <button className="secondary" onClick={() => toggle(goal)}>✓ Marcar cumplido</button>
              <button className="goal-delete" onClick={() => remove(goal)}>Eliminar</button>
            </div>
          </article>
        ))}

        {completed.length > 0 && (
          <details className="completed-goals">
            <summary>Ver objetivos cumplidos ({completed.length})</summary>
            {completed.map(goal => (
              <div key={goal.id}>
                <span>✓</span>
                <div><b>{goal.area}</b><small>{goal.text}</small></div>
                <button onClick={() => toggle(goal)}>Reabrir</button>
              </div>
            ))}
          </details>
        )}
      </section>
    </div>
  )
}
