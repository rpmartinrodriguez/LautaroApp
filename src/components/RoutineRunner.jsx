import React, { useState } from 'react'

function speak(text) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'es-AR'
  utterance.rate = 0.68
  speechSynthesis.speak(utterance)
}

export default function RoutineRunner({ routine, onClose, onComplete }) {
  const [index, setIndex] = useState(0)
  const step = routine.steps[index]
  const last = index === routine.steps.length - 1

  const next = () => {
    if (last) {
      onComplete?.(routine)
      return
    }
    setIndex(value => value + 1)
  }

  return (
    <div className="guided-overlay">
      <div className="routine-runner">
        <header>
          <button className="ghost" onClick={onClose}>× Salir</button>
          <div>
            <p className="kicker">RUTINA</p>
            <h2>{routine.icon} {routine.title}</h2>
          </div>
        </header>

        <div className="routine-progress">
          {routine.steps.map((_,i) => <span className={i <= index ? 'done' : ''} key={i} />)}
        </div>

        <main>
          <div className="routine-step-icon">{step.icon}</div>
          <p className="kicker">PASO {index + 1} DE {routine.steps.length}</p>
          <h2>{step.text}</h2>
          <button className="secondary" onClick={() => speak(step.text)}>🔊 Escuchar</button>
          <button className="primary routine-done" onClick={next}>{last ? 'Terminé la rutina' : '✓ Listo'}</button>
        </main>
      </div>
    </div>
  )
}
