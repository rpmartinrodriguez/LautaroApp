import React, { useMemo, useState } from 'react'
import PronunciationControls from './PronunciationControls'
import { recordAttempt } from '../services/progressEngine'
import { getQuantityMax, quantityOptions } from '../services/mathEngine'

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function makeRound(words, type, index) {
  const target = words[index % words.length]

  if (type === 'sound') {
    const targetLetter = target.word[0].toUpperCase()
    const alphabet = ['A','E','I','O','U','M','P','L','S','T','C','D','F','G']
    const distractors = shuffle(alphabet.filter(letter => letter !== targetLetter)).slice(0, 2)
    return {
      id: type + '-' + index + '-' + target.id,
      type,
      target,
      options: shuffle([targetLetter, ...distractors]).map(letter => ({
        id: 'letter-' + letter,
        word: letter,
        letter,
      })),
    }
  }

  const distractors = shuffle(words.filter(item => item.id !== target.id)).slice(0, 2)
  return {
    id: type + '-' + index + '-' + target.id,
    type,
    target,
    options: shuffle([target, ...distractors]),
  }
}

function buildRounds(words, focusType, quantityMax) {
  if (!words.length) return []

  const focus = ['visual', 'sound', 'build', 'quantity'].includes(focusType) ? focusType : 'visual'
  const sequence = [
    'visual',
    focus,
    'syllables',
    focus,
    'sound',
    'visual',
    focus,
    'finish',
  ]

  return sequence.map((type, index) => {
    if (type === 'finish') return { id: 'finish', type: 'finish' }
    if (type === 'quantity') {
      return {
        id: 'quantity-' + index,
        type: 'quantity',
        count: 1 + Math.floor(Math.random() * quantityMax),
        max: quantityMax,
      }
    }
    return makeRound(words, type, index)
  })
}

function skillForType(type, fallbackSkill) {
  if (type === 'sound') return 'fonologia-1'
  if (type === 'build') return 'construccion-1'
  if (type === 'quantity') return 'matematica-1'
  if (type === 'visual' || type === 'syllables') return fallbackSkill || 'visual-1'
  return fallbackSkill || 'visual-1'
}

export default function GuidedSession({
  words,
  progress,
  focusMission,
  onCommit,
  onClose,
  onFinish,
}) {
  const quantityMax = getQuantityMax(progress)
  const rounds = useMemo(
    () => buildRounds(words, focusMission?.type || 'visual', quantityMax),
    [words, focusMission?.type, quantityMax],
  )
  const [index, setIndex] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [built, setBuilt] = useState([])
  const [helpUsed, setHelpUsed] = useState(false)
  const [startedAt, setStartedAt] = useState(Date.now())
  const round = rounds[index]

  if (!round) return null

  const commitAnswer = (correct, itemId, type = round.type) => {
    const next = recordAttempt(progress, {
      skillId: skillForType(type, focusMission?.skillId),
      itemId,
      correct,
      helpLevel: helpUsed ? 1 : 0,
      responseMs: Date.now() - startedAt,
    })
    onCommit(next)
    setFeedback(correct ? 'correct' : 'retry')
  }

  const goNext = () => {
    setFeedback(null)
    setBuilt([])
    setHelpUsed(false)
    setStartedAt(Date.now())
    setIndex(current => Math.min(current + 1, rounds.length - 1))
  }

  const pct = Math.round(((index + 1) / rounds.length) * 100)

  if (round.type === 'finish') {
    return (
      <div className="guided-overlay">
        <div className="guided-shell finish-screen">
          <div className="finish-burst">⚡</div>
          <p className="kicker">ENTRENAMIENTO COMPLETADO</p>
          <h2>¡Misión cumplida!</h2>
          <p>Hoy practicamos palabras, sonidos y atención en una sesión breve.</p>
          <div className="real-life-task">
            <b>Última misión fuera de la pantalla</b>
            <p>Elegí una de las palabras practicadas y usala una vez en una situación real: pedir, señalar, buscar o nombrar.</p>
          </div>
          <button className="primary" onClick={onFinish || onClose}>Terminar por hoy</button>
        </div>
      </div>
    )
  }

  return (
    <div className="guided-overlay">
      <div className="guided-shell">
        <header className="guided-header">
          <button className="ghost" onClick={onClose}>× Salir</button>
          <div>
            <b>Entrenamiento guiado</b>
            <small>{index + 1} de {rounds.length}</small>
          </div>
          <div className="guided-bar"><span style={{ width: pct + '%' }} /></div>
        </header>

        <main className="guided-main">
          {round.type === 'visual' && (
            <ChoiceRound
              title={'¿Dónde dice ' + round.target.word + '?'}
              round={round}
              feedback={feedback}
              onChoose={item => commitAnswer(item.id === round.target.id, round.target.id)}
              onNext={goNext}
            />
          )}

          {round.type === 'sound' && (
            <ChoiceRound
              title={'¿Cuál empieza como “' + round.target.word[0] + '”?'}
              round={round}
              feedback={feedback}
              showPronunciation
              onSupportUse={() => setHelpUsed(true)}
              onChoose={item => commitAnswer(item.letter === round.target.word[0].toUpperCase(), round.target.id, 'sound')}
              onNext={goNext}
            />
          )}

          {round.type === 'syllables' && (
            <section className="guided-task">
              <Visual item={round.target} />
              <p className="kicker">ESCUCHAR Y REPETIR</p>
              <h2>{round.target.word}</h2>
              <p className="muted">Escuchen primero por sílabas. Después Lautaro puede repetir a su manera. No hace falta que salga perfecto.</p>
              <PronunciationControls item={round.target} onSupportUse={onSupportUse} />
              <button className="primary guided-continue" onClick={goNext}>Listo, seguimos</button>
            </section>
          )}

          {round.type === 'build' && (
            <BuildRound
              round={round}
              built={built}
              setBuilt={setBuilt}
              feedback={feedback}
              onDone={correct => commitAnswer(correct, round.target.id, 'build')}
              onNext={goNext}
              onSupportUse={() => setHelpUsed(true)}
            />
          )}

          {round.type === 'quantity' && (
            <QuantityRound
              round={round}
              feedback={feedback}
              onChoose={value => commitAnswer(value === round.count, 'cantidad-' + round.count, 'quantity')}
              onNext={goNext}
            />
          )}
        </main>
      </div>
    </div>
  )
}

function ChoiceRound({ title, round, feedback, onChoose, onNext, showPronunciation = false, onSupportUse }) {
  return (
    <section className="guided-task">
      <Visual item={round.target} />
      <p className="kicker">MISIÓN</p>
      <h2>{title}</h2>
      {showPronunciation && <PronunciationControls item={round.target} onSupportUse={onSupportUse} />}
      <div className="guided-options">
        {round.options.map(item => (
          <button key={item.id} disabled={!!feedback} onClick={() => onChoose(item)}>{item.word}</button>
        ))}
      </div>
      <Feedback feedback={feedback} correctText={round.target.word} onNext={onNext} />
    </section>
  )
}

function BuildRound({ round, built, setBuilt, feedback, onDone, onNext, onSupportUse }) {
  const clean = round.target.word.replace(/Á/g, 'A').replace(/É/g, 'E').replace(/Í/g, 'I').replace(/Ó/g, 'O').replace(/Ú/g, 'U')
  const letters = useMemo(() => shuffle(clean.split('')), [clean])
  const value = built.join('')

  const add = letter => {
    if (feedback || built.length >= clean.length) return
    const next = [...built, letter]
    setBuilt(next)
    if (next.length === clean.length) onDone(next.join('') === clean)
  }

  return (
    <section className="guided-task">
      <Visual item={round.target} />
      <p className="kicker">CONSTRUIR</p>
      <h2>Armá {round.target.word}</h2>
      <PronunciationControls item={round.target} />
      <div className="guided-slots">{clean.split('').map((_,i) => <span key={i}>{built[i] || '•'}</span>)}</div>
      <div className="guided-letters">{letters.map((letter,i) => <button key={i} onClick={() => add(letter)}>{letter}</button>)}</div>
      {!feedback && value && <button className="secondary" onClick={() => setBuilt([])}>Empezar de nuevo</button>}
      <Feedback feedback={feedback} correctText={round.target.word} onNext={onNext} />
    </section>
  )
}

function QuantityRound({ round, feedback, onChoose, onNext }) {
  return (
    <section className="guided-task">
      <p className="kicker">CANTIDAD</p>
      <h2>¿Cuántos escudos hay?</h2>
      <div className="guided-count">{Array.from({ length: round.count }).map((_,i) => <span key={i}>🛡️</span>)}</div>
      <div className="guided-options numbers">{quantityOptions(round.count, round.max || 5).map(n => <button key={n} disabled={!!feedback} onClick={() => onChoose(n)}>{n}</button>)}</div>
      <Feedback feedback={feedback} correctText={String(round.count)} onNext={onNext} />
    </section>
  )
}

function Feedback({ feedback, correctText, onNext }) {
  if (!feedback) return null
  return (
    <div className={'guided-feedback ' + feedback}>
      <span>{feedback === 'correct' ? '⚡' : '💪'}</span>
      <div>
        <b>{feedback === 'correct' ? '¡Muy bien!' : 'Bien por intentarlo'}</b>
        {feedback !== 'correct' && <small>La respuesta es {correctText}.</small>}
      </div>
      <button className="primary" onClick={onNext}>Seguimos</button>
    </div>
  )
}

function Visual({ item }) {
  if (item?.imageUrl) return <div className="guided-visual"><img src={item.imageUrl} alt="" /></div>
  return <div className="guided-emoji">{item?.emoji || '⭐'}</div>
}
