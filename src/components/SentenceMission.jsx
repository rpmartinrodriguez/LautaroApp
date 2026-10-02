import React, { useMemo, useState } from 'react'
import { getAvailableSentences } from '../services/sentenceEngine'
import { recordAttempt } from '../services/progressEngine'

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function speak(text, slow = false) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text.toLowerCase())
  utterance.lang = 'es-AR'
  utterance.rate = slow ? 0.52 : 0.72
  speechSynthesis.speak(utterance)
}

export default function SentenceMission({ words, progress, onCommit, onClose }) {
  const available = useMemo(() => getAvailableSentences(words, progress), [words, progress.wordStats])
  const target = useMemo(() => available[Math.floor(Math.random() * available.length)], [available.length])
  const [feedback, setFeedback] = useState(null)

  if (!target) {
    return (
      <div className="guided-overlay">
        <div className="sentence-shell locked">
          <div className="sentence-icon">📖</div>
          <h2>Las frases se desbloquean más adelante</h2>
          <p>Primero vamos a consolidar suficientes palabras. La app las habilitará automáticamente.</p>
          <button className="primary" onClick={onClose}>Volver</button>
        </div>
      </div>
    )
  }

  const distractors = shuffle(available.filter(item => item.id !== target.id)).slice(0,2)
  const options = shuffle([target, ...distractors])

  const answer = option => {
    if (feedback) return
    const correct = option.id === target.id
    const next = recordAttempt(progress, {
      skillId: 'frases-1',
      itemId: target.id,
      correct,
    })
    onCommit(next)
    setFeedback(correct ? 'correct' : 'retry')
  }

  return (
    <div className="guided-overlay">
      <div className="sentence-shell">
        <header>
          <button className="ghost" onClick={onClose}>× Salir</button>
          <p className="kicker">MISIÓN DE FRASES</p>
        </header>

        <div className="sentence-emoji">{target.emoji}</div>
        <h2>Escuchá y elegí la frase</h2>
        <div className="sentence-audio">
          <button className="secondary" onClick={() => speak(target.text)}>🔊 Escuchar</button>
          <button className="secondary" onClick={() => speak(target.text, true)}>🐢 Despacio</button>
        </div>

        <div className="sentence-options">
          {options.map(option => (
            <button key={option.id} disabled={!!feedback} onClick={() => answer(option)}>{option.text}</button>
          ))}
        </div>

        {feedback && (
          <div className={'guided-feedback ' + feedback}>
            <span>{feedback === 'correct' ? '⚡' : '💪'}</span>
            <div>
              <b>{feedback === 'correct' ? '¡Muy bien!' : 'Probamos juntos'}</b>
              {feedback !== 'correct' && <small>La frase es {target.text}.</small>}
            </div>
            <button className="primary" onClick={onClose}>Listo</button>
          </div>
        )}
      </div>
    </div>
  )
}
