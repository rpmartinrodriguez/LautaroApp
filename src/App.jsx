import React, { useEffect, useMemo, useState } from 'react'
import { curriculum, starterWords } from './data/curriculum'
import { accuracy, defaultProgress, loadProgress, masteryStatus, recordAttempt, saveProgress } from './services/progressEngine'
import { loadCloudProgress, mergeProgress, saveCloudProgress } from './services/cloudProgress'
import AssessmentFlow from './components/AssessmentFlow'
import PlanPanel from './components/PlanPanel'

const heroBadges = [
  { min: 0, label: 'Aprendiz', icon: '🛡️' },
  { min: 50, label: 'Explorador', icon: '⚡' },
  { min: 120, label: 'Guardián', icon: '🦸' },
  { min: 250, label: 'Héroe', icon: '🏆' },
]

function getBadge(xp) {
  return [...heroBadges].reverse().find(b => xp >= b.min) || heroBadges[0]
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

export default function App() {
  const [mode, setMode] = useState('home')
  const [progress, setProgress] = useState(loadProgress)
  const [exercise, setExercise] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [adultTab, setAdultTab] = useState('plan')
  const [showAssessment, setShowAssessment] = useState(false)
  const [syncStatus, setSyncStatus] = useState('connecting')
  const badge = getBadge(progress.xp)

  useEffect(() => {
    let mounted = true

    async function connectCloud() {
      try {
        const remote = await loadCloudProgress()
        if (!mounted) return

        if (!remote.enabled) {
          setSyncStatus(remote.reason === 'not-configured' ? 'not-configured' : 'offline')
          return
        }

        const merged = mergeProgress(loadProgress(), remote.progress)
        saveProgress(merged)
        setProgress(merged)
        await saveCloudProgress(merged)
        if (mounted) setSyncStatus('synced')
      } catch {
        if (mounted) setSyncStatus('offline')
      }
    }

    connectCloud()
    return () => { mounted = false }
  }, [])

  const commitProgress = (next) => {
    saveProgress(next)
    setProgress(next)
    setSyncStatus('syncing')
    saveCloudProgress(next)
      .then(result => setSyncStatus(result.enabled ? 'synced' : (result.reason === 'not-configured' ? 'not-configured' : 'offline')))
      .catch(() => setSyncStatus('offline'))
  }

  const startExercise = (type = 'visual') => {
    const target = starterWords[Math.floor(Math.random() * starterWords.length)]
    const options = shuffle([target, ...shuffle(starterWords.filter(w => w.id !== target.id)).slice(0, 2)])
    setExercise({ type, target, options, startedAt: Date.now() })
    setFeedback(null)
    setMode('exercise')
  }

  const answer = (word, skillId = 'visual-1') => {
    if (!exercise || feedback) return
    const correct = word.id === exercise.target.id
    const next = recordAttempt(progress, {
      skillId,
      itemId: exercise.target.id,
      correct,
      helpLevel: 0,
      responseMs: Date.now() - exercise.startedAt,
    })
    commitProgress(next)
    setFeedback(correct ? 'correct' : 'retry')
  }

  const nextExercise = () => startExercise(exercise?.type || 'visual')

  const resetData = () => {
    if (!confirm('¿Seguro que querés borrar el progreso guardado en este dispositivo?')) return
    const clean = { ...defaultProgress, sessions: [], wordStats: {}, skillStats: {}, assessment: { ...defaultProgress.assessment, answers: {} } }
    commitProgress(clean)
  }

  if (mode === 'home') {
    return (
      <div className="app shell">
        <header className="topbar">
          <div>
            <div className="eyebrow">BASE DE HÉROES</div>
            <h1>Lautaro</h1>
          </div>
          <div className="top-actions"><SyncPill status={syncStatus} /><div className="badge-chip"><span>{badge.icon}</span><b>{badge.label}</b><small>{progress.xp} XP</small></div></div>
        </header>

        <main className="home-grid">
          <section className="hero-panel">
            <div className="hero-orb">🦸</div>
            <div>
              <p className="kicker">MISIÓN DEL DÍA</p>
              <h2>Entrenamos un poder nuevo</h2>
              <p className="muted">Actividades cortas, claras y adaptadas. Una misión a la vez.</p>
              <button className="primary" onClick={() => setMode('child')}>Entrar a mis misiones</button>
              {progress.assessment?.status !== 'completed' && <button className="hero-link" onClick={() => { setMode('adult'); setAdultTab('plan') }}>Primero: preparar mi plan →</button>}
            </div>
          </section>

          <section className="adult-card">
            <div className="adult-icon">🧭</div>
            <div>
              <p className="kicker">MODO ADULTO</p>
              <h3>Plan, progreso y próximo paso</h3>
              <p className="muted">Vas a ver qué trabajar, por qué, cuándo avanzar y qué hacer fuera de la app.</p>
            </div>
            <button className="secondary" onClick={() => setMode('adult')}>Abrir panel</button>
          </section>
        </main>
      </div>
    )
  }

  if (mode === 'child') {
    return (
      <div className="app shell child-bg">
        <header className="topbar">
          <button className="ghost" onClick={() => setMode('home')}>← Volver</button>
          <div className="badge-chip"><span>{badge.icon}</span><b>{badge.label}</b><small>{progress.xp} XP</small></div>
        </header>

        <main>
          <div className="section-head">
            <p className="kicker">HOLA, LAUTARO</p>
            <h2>Elegí tu misión</h2>
            <p className="muted">Hoy alcanza con completar unas pocas. Cuando terminamos, terminamos.</p>
          </div>

          <div className="mission-grid">
            <button className="mission-card mission-blue" onClick={() => startExercise('visual')}>
              <span className="mission-icon">👀</span>
              <span><b>Observación</b><small>Encontrá la palabra correcta</small></span>
              <em>+10 XP</em>
            </button>
            <button className="mission-card mission-violet" onClick={() => startExercise('sound')}>
              <span className="mission-icon">👂</span>
              <span><b>Sonidos</b><small>Escuchá y elegí</small></span>
              <em>+10 XP</em>
            </button>
            <button className="mission-card mission-orange" onClick={() => startExercise('build')}>
              <span className="mission-icon">🧩</span>
              <span><b>Construcción</b><small>Armá la palabra</small></span>
              <em>+15 XP</em>
            </button>
            <button className="mission-card mission-green" onClick={() => startExercise('quantity')}>
              <span className="mission-icon">🔢</span>
              <span><b>Cantidad</b><small>Contá y elegí</small></span>
              <em>+10 XP</em>
            </button>
          </div>

          <section className="power-path">
            <div>
              <p className="kicker">TU CAMINO</p>
              <h3>Los poderes se entrenan de a poco</h3>
            </div>
            <div className="path-line">
              {['👀','🔤','👂','🧩','✍️','📖','🧭'].map((x,i) => <span className={i < Math.min(7, Math.floor(progress.xp/40)+1) ? 'done':''} key={i}>{x}</span>)}
            </div>
          </section>
        </main>
      </div>
    )
  }

  if (mode === 'exercise' && exercise) {
    return <ExerciseView exercise={exercise} feedback={feedback} onAnswer={answer} onNext={nextExercise} onBack={() => setMode('child')} />
  }

  return (
    <div className="app shell">
      <header className="topbar">
        <button className="ghost" onClick={() => setMode('home')}>← Inicio</button>
        <div>
          <div className="eyebrow">PANEL ADULTO</div>
          <h2>Guía de acompañamiento</h2>
        </div>
      </header>

      <nav className="tabs">
        {[
          ['plan','Mi plan'],
          ['ruta','Ruta completa'],
          ['progreso','Progreso'],
          ['sesion','Sesión de hoy'],
          ['biblioteca','Biblioteca'],
        ].map(([id,label]) => (
          <button key={id} className={adultTab===id?'active':''} onClick={() => setAdultTab(id)}>{label}</button>
        ))}
      </nav>

      <main className="adult-main">
        {adultTab === 'plan' && <PlanPanel progress={progress} onStartAssessment={() => setShowAssessment(true)} />}
        {adultTab === 'ruta' && <RoutePanel progress={progress} />}
        {adultTab === 'progreso' && <ProgressPanel progress={progress} onReset={resetData} syncStatus={syncStatus} />}
        {adultTab === 'sesion' && <SessionPanel onStart={() => startExercise('visual')} />}
        {adultTab === 'biblioteca' && <LibraryPanel />}
      </main>
      {showAssessment && (
        <AssessmentFlow
          progress={progress}
          onChange={commitProgress}
          onClose={() => setShowAssessment(false)}
          onComplete={(next) => { commitProgress(next); setShowAssessment(false); setAdultTab('plan') }}
        />
      )}
    </div>
  )
}

function ExerciseView({ exercise, feedback, onAnswer, onNext, onBack }) {
  if (exercise.type === 'build') return <BuildExercise exercise={exercise} onBack={onBack} onNext={onNext} />
  if (exercise.type === 'quantity') return <QuantityExercise onBack={onBack} onNext={onNext} />

  const instruction = exercise.type === 'sound'
    ? '¿Cuál empieza como “' + exercise.target.word[0] + '”?'
    : '¿Dónde dice ' + exercise.target.word + '?'

  const speak = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(exercise.target.word.toLowerCase())
      u.lang = 'es-AR'
      u.rate = 0.75
      speechSynthesis.speak(u)
    }
  }

  return (
    <div className="app exercise-page">
      <header className="exercise-top">
        <button className="ghost light" onClick={onBack}>← Salir</button>
        <div className="tiny-progress"><span style={{width:'42%'}} /></div>
      </header>
      <main className="exercise-card-wrap">
        <section className="exercise-card">
          <div className="big-emoji">{exercise.target.emoji}</div>
          <p className="kicker">MISIÓN DE OBSERVACIÓN</p>
          <h2>{instruction}</h2>
          <button className="listen" onClick={speak}>🔊 Escuchar</button>

          <div className="answer-grid">
            {exercise.options.map(w => (
              <button key={w.id} disabled={!!feedback} onClick={() => onAnswer(w, exercise.type === 'sound' ? 'fonologia-1' : 'visual-1')}>
                {w.word}
              </button>
            ))}
          </div>

          {feedback && (
            <div className={'feedback ' + feedback}>
              <div className="feedback-icon">{feedback === 'correct' ? '⚡' : '💪'}</div>
              <div>
                <b>{feedback === 'correct' ? '¡Muy bien!' : 'Casi. Lo intentamos juntos.'}</b>
                <p>{feedback === 'correct' ? 'Sumaste experiencia.' : 'La palabra era ' + exercise.target.word + '.'}</p>
              </div>
              <button className="primary" onClick={onNext}>Siguiente</button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function BuildExercise({ exercise, onBack, onNext }) {
  const [letters, setLetters] = useState([])
  const pool = useMemo(() => shuffle(exercise.target.word.replace('Á','A').split('')), [exercise.target.word])
  const cleanTarget = exercise.target.word.replace('Á','A')
  const value = letters.join('')
  const done = value === cleanTarget

  return (
    <div className="app exercise-page">
      <header className="exercise-top"><button className="ghost light" onClick={onBack}>← Salir</button></header>
      <main className="exercise-card-wrap">
        <section className="exercise-card">
          <div className="big-emoji">{exercise.target.emoji}</div>
          <p className="kicker">MISIÓN DE CONSTRUCCIÓN</p>
          <h2>Armá la palabra</h2>
          <div className="word-model">{exercise.target.word}</div>
          <div className="letter-slots">
            {cleanTarget.split('').map((_,i)=><span key={i}>{letters[i] || '•'}</span>)}
          </div>
          <div className="letter-pool">
            {pool.map((l,i)=><button key={i} onClick={() => setLetters(prev => prev.length < cleanTarget.length ? [...prev,l] : prev)}>{l}</button>)}
          </div>
          <button className="secondary" onClick={() => setLetters([])}>Borrar</button>
          {done && <div className="feedback correct"><div className="feedback-icon">🧩</div><div><b>¡La armaste!</b><p>{exercise.target.word}</p></div><button className="primary" onClick={onNext}>Siguiente</button></div>}
        </section>
      </main>
    </div>
  )
}

function QuantityExercise({ onBack, onNext }) {
  const [round] = useState(() => 1 + Math.floor(Math.random()*5))
  const [selected,setSelected] = useState(null)
  const correct = selected === round
  return (
    <div className="app exercise-page">
      <header className="exercise-top"><button className="ghost light" onClick={onBack}>← Salir</button></header>
      <main className="exercise-card-wrap">
        <section className="exercise-card">
          <p className="kicker">MISIÓN DE CANTIDAD</p>
          <h2>¿Cuántos escudos hay?</h2>
          <div className="count-items">{Array.from({length:round}).map((_,i)=><span key={i}>🛡️</span>)}</div>
          <div className="number-grid">{[1,2,3,4,5].map(n=><button key={n} disabled={selected!==null} onClick={()=>setSelected(n)}>{n}</button>)}</div>
          {selected!==null && <div className={'feedback ' + (correct?'correct':'retry')}><div className="feedback-icon">{correct?'⚡':'💪'}</div><div><b>{correct?'¡Exacto!':'Probamos otra vez'}</b><p>Hay {round}.</p></div><button className="primary" onClick={onNext}>Siguiente</button></div>}
        </section>
      </main>
    </div>
  )
}

function RoutePanel({ progress }) {
  return (
    <>
      <section className="guide-callout">
        <div>🧭</div>
        <div><p className="kicker">REGLA GENERAL</p><h3>No avanzar por edad ni por calendario</h3><p>Se avanza cuando la habilidad aparece de forma estable en distintos días y con menos ayuda. Si se frustra o cae el rendimiento, se vuelve un escalón.</p></div>
      </section>
      <div className="route-list">
        {curriculum.map((item, index) => {
          const stat = progress.skillStats[item.id]
          const acc = accuracy(stat)
          return (
            <article className="route-card" key={item.id}>
              <div className="route-number">{index+1}</div>
              <div className="route-icon">{item.icon}</div>
              <div className="route-body">
                <span className="area">{item.area}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <details>
                  <summary>Ver paso a paso</summary>
                  <div className="details-grid">
                    <div><b>Por qué</b><p>{item.why}</p></div>
                    <div><b>Cuándo avanzar</b><p>{item.mastery}</p></div>
                    <div><b>En casa</b><p>{item.homeTask}</p></div>
                  </div>
                </details>
              </div>
              <div className="route-status"><b>{stat ? acc + '%' : '—'}</b><small>{stat ? masteryStatus(stat) : 'sin iniciar'}</small></div>
            </article>
          )
        })}
      </div>
    </>
  )
}

function SyncPill({ status }) {
  const map = {
    connecting: ['⏳','Conectando'],
    syncing: ['↻','Sincronizando'],
    synced: ['☁️','Guardado'],
    offline: ['📱','Solo dispositivo'],
    'not-configured': ['⚙️','Firebase pendiente'],
  }
  const [icon,label] = map[status] || map.offline
  return <div className={'sync-pill ' + status}><span>{icon}</span><small>{label}</small></div>
}

function ProgressPanel({ progress, onReset, syncStatus }) {
  const rows = starterWords.map(w => ({...w, stat: progress.wordStats[w.id]}))
  return (
    <div className="dashboard">
      <section className="cloud-card"><div><b>Estado del respaldo</b><p>{syncStatus === 'synced' ? 'El progreso de este dispositivo está sincronizado con Firebase.' : syncStatus === 'not-configured' ? 'Faltan las variables de Firebase en Netlify.' : syncStatus === 'connecting' || syncStatus === 'syncing' ? 'Estamos sincronizando el progreso…' : 'La app sigue funcionando localmente y reintentará cuando haya conexión.'}</p></div><SyncPill status={syncStatus} /></section>
      <div className="stat-card"><span>⚡</span><b>{progress.xp}</b><small>Experiencia total</small></div>
      <div className="stat-card"><span>🎯</span><b>{Object.values(progress.skillStats).reduce((a,s)=>a+s.attempts,0)}</b><small>Intentos registrados</small></div>
      <div className="stat-card"><span>📚</span><b>{rows.filter(r => accuracy(r.stat)>=80 && (r.stat?.attempts||0)>=5).length}</b><small>Palabras avanzando</small></div>

      <section className="table-card">
        <h3>Palabras iniciales</h3>
        <div className="simple-table">
          {rows.map(r => <div className="table-row" key={r.id}><span className="word-cell">{r.emoji} {r.word}</span><span>{r.stat?.attempts || 0} intentos</span><span>{accuracy(r.stat)}%</span><span className={'status ' + masteryStatus(r.stat)}>{masteryStatus(r.stat)}</span></div>)}
        </div>
      </section>

      <section className="safety-note"><b>Importante</b><p>Estos datos sirven para acompañar el aprendizaje. No diagnostican ni reemplazan la evaluación de sus profesionales.</p></section>
      <button className="danger-link" onClick={onReset}>Borrar datos de prueba de este dispositivo</button>
    </div>
  )
}

function SessionPanel({ onStart }) {
  return (
    <div className="session-layout">
      <section className="session-card">
        <p className="kicker">PROPUESTA DE HOY · 25–30 MIN</p>
        <h2>Sesión breve y con final claro</h2>
        <div className="timeline">
          {[
            ['5 min','Repaso','Palabras que ya conoce. Empezar con éxito.'],
            ['5 min','Palabra nueva','Una sola palabra significativa.'],
            ['5 min','Sonidos','Una o dos correspondencias letra–sonido.'],
            ['5 min','Construcción','Letras móviles o actividad de armado.'],
            ['5 min','Vida real','Usar una palabra o rutina fuera de la pantalla.'],
          ].map(([t,n,d])=><div key={n}><b>{t}</b><span><strong>{n}</strong><small>{d}</small></span></div>)}
        </div>
        <button className="primary" onClick={onStart}>Comenzar primera misión</button>
      </section>
      <section className="session-card soft">
        <h3>Qué observar</h3>
        <p>✓ Si responde solo o necesita señal.</p>
        <p>✓ Si entiende aunque no pronuncie bien.</p>
        <p>✓ Cuándo empieza a cansarse.</p>
        <p>✓ Si usa lo aprendido después, en la vida real.</p>
        <hr />
        <b>Regla práctica</b>
        <p>Es preferible terminar con ganas de seguir que insistir hasta que aparezca frustración.</p>
      </section>
    </div>
  )
}

function LibraryPanel() {
  return (
    <div className="library-card">
      <div className="library-icon">📸</div>
      <div>
        <p className="kicker">BIBLIOTECA PERSONAL</p>
        <h2>El mundo de Lautaro va a ser el material de aprendizaje</h2>
        <p>La siguiente versión permitirá cargar fotos reales, grabar voces y convertir cada concepto en ejercicios de lectura, sonidos, construcción, frases y rutinas.</p>
        <div className="coming-list">
          <span>Foto real</span><span>Palabra</span><span>Audio</span><span>Sílabas</span><span>Rutina</span>
        </div>
        <p className="muted">Esta pantalla ya queda preparada como parte del flujo del producto.</p>
      </div>
    </div>
  )
}
