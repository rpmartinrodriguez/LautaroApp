import React, { useMemo, useState } from 'react'
import { recordAttempt } from '../services/progressEngine'

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

export default function MemoryMission({ words, progress, onCommit, onClose }) {
  const level = progress?.skillStats?.['memoria-1']?.attempts >= 10 ? 3 : 2
  const usable = words.filter(word => word.emoji || word.imageUrl)
  const target = useMemo(() => shuffle(usable).slice(0, level), [usable.length, level])
  const [phase, setPhase] = useState('show')
  const [feedback, setFeedback] = useState(null)

  const alternatives = useMemo(() => {
    if (!target.length) return []
    const other = shuffle(usable.filter(word => !target.some(item => item.id === word.id))).slice(0, level)
    const wrongA = [...target]
    if (other[0]) wrongA[wrongA.length - 1] = other[0]
    const wrongB = [...target].reverse()
    return shuffle([
      { id:'correct', items:target },
      { id:'a', items:wrongA },
      { id:'b', items:wrongB },
    ])
  }, [target.map(item => item.id).join('|')])

  if (usable.length < 4) {
    return (
      <div className="guided-overlay">
        <div className="sentence-shell locked">
          <div className="sentence-icon">🎯</div>
          <h2>Necesitamos algunas palabras más</h2>
          <p>Cargá más conceptos en la Biblioteca para poder variar la actividad de memoria.</p>
          <button className="primary" onClick={onClose}>Volver</button>
        </div>
      </div>
    )
  }

  const answer = option => {
    if (feedback) return
    const correct = option.id === 'correct'
    const next = recordAttempt(progress, {
      skillId: 'memoria-1',
      itemId: 'secuencia-' + level,
      correct,
    })
    onCommit(next)
    setFeedback(correct ? 'correct' : 'retry')
  }

  return (
    <div className="guided-overlay">
      <div className="memory-shell">
        <header>
          <button className="ghost" onClick={onClose}>× Salir</button>
          <p className="kicker">PODER DE MEMORIA · NIVEL {level - 1}</p>
        </header>

        {phase === 'show' ? (
          <>
            <h2>Mirá y recordá</h2>
            <div className="memory-sequence">
              {target.map(item => <Visual key={item.id} item={item} />)}
            </div>
            <button className="primary" onClick={() => setPhase('choose')}>Ya lo vi</button>
          </>
        ) : (
          <>
            <h2>¿Qué viste?</h2>
            <div className="memory-options">
              {alternatives.map(option => (
                <button key={option.id} disabled={!!feedback} onClick={() => answer(option)}>
                  {option.items.map(item => <Visual key={item.id} item={item} compact />)}
                </button>
              ))}
            </div>
            {feedback && (
              <div className={'guided-feedback ' + feedback}>
                <span>{feedback === 'correct' ? '⚡' : '💪'}</span>
                <div><b>{feedback === 'correct' ? '¡Lo recordaste!' : 'Lo volvemos a mirar otro día'}</b></div>
                <button className="primary" onClick={onClose}>Listo</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Visual({ item, compact = false }) {
  if (item.imageUrl) {
    return <div className={'memory-visual ' + (compact ? 'compact' : '')}><img src={item.imageUrl} alt="" /></div>
  }
  return <div className={'memory-emoji ' + (compact ? 'compact' : '')}>{item.emoji || '⭐'}</div>
}
