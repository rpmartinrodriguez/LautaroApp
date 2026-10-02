import React, { useMemo, useState } from 'react'
import { routineTemplates } from '../data/routines'

export default function RoutinesPanel({ progress, onStart, onChange }) {
  const stats = progress.routineStats || {}
  const custom = progress.customRoutines || []
  const routines = useMemo(() => [...routineTemplates, ...custom], [custom])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [steps, setSteps] = useState('')

  const createRoutine = event => {
    event.preventDefault()
    const cleanSteps = steps
      .split('\n')
      .map(value => value.trim())
      .filter(Boolean)

    if (!title.trim() || cleanSteps.length < 2) return

    const routine = {
      id: 'custom-' + crypto.randomUUID(),
      title: title.trim(),
      icon: icon.trim() || '⭐',
      custom: true,
      steps: cleanSteps.map((text, index) => ({
        text,
        icon: index === cleanSteps.length - 1 ? '✅' : '➡️',
      })),
    }

    onChange({
      ...progress,
      customRoutines: [...custom, routine],
    })

    setTitle('')
    setIcon('⭐')
    setSteps('')
    setShowForm(false)
  }

  const removeRoutine = routine => {
    if (!routine.custom) return
    if (!confirm('¿Eliminar la rutina “' + routine.title + '”?')) return

    onChange({
      ...progress,
      customRoutines: custom.filter(item => item.id !== routine.id),
    })
  }

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

      <div className="routine-toolbar">
        <div>
          <h3>Rutinas disponibles</h3>
          <p className="muted">Podés usar las propuestas o crear una secuencia propia.</p>
        </div>
        <button className="secondary" onClick={() => setShowForm(value => !value)}>
          {showForm ? 'Cerrar' : '+ Crear rutina'}
        </button>
      </div>

      {showForm && (
        <form className="routine-form" onSubmit={createRoutine}>
          <label>
            <span>Nombre</span>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Prepararse para dormir" />
          </label>
          <label>
            <span>Icono</span>
            <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={8} />
          </label>
          <label className="routine-steps-field">
            <span>Pasos, uno por línea</span>
            <textarea
              value={steps}
              onChange={e => setSteps(e.target.value)}
              placeholder={"Guardar juguetes\nPonerse el pijama\nLavarse los dientes\nIr a la cama"}
              rows={6}
            />
          </label>
          <button className="primary">Guardar rutina</button>
        </form>
      )}

      <div className="routine-grid">
        {routines.map(routine => {
          const stat = stats[routine.id] || { completions: 0 }
          return (
            <article key={routine.id} className="routine-card">
              <div className="routine-card-icon">{routine.icon}</div>
              <div>
                <h3>{routine.title}</h3>
                <p>{routine.steps.length} pasos</p>
                <small>{stat.completions || 0} veces completada</small>
              </div>
              <div className="routine-actions">
                <button className="secondary" onClick={() => onStart(routine)}>Practicar</button>
                {routine.custom && <button className="routine-delete" onClick={() => removeRoutine(routine)}>Eliminar</button>}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
