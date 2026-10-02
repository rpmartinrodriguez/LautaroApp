import React, { useEffect, useMemo, useState } from 'react'
import { curriculum } from './data/curriculum'
import { builtInWordBank, starterWords } from './data/wordBank'
import { accuracy, defaultProgress, loadProgress, masteryStatus, recordAttempt, saveProgress } from './services/progressEngine'
import { loadCloudProgress, mergeProgress, saveCloudProgress } from './services/cloudProgress'
import AssessmentFlow from './components/AssessmentFlow'
import PlanPanel from './components/PlanPanel'
import { getRecommendedMission, getUnlockedSkillIndex } from './services/adaptiveEngine'
import InstallPWA from './components/InstallPWA'
import ConceptLibrary from './components/ConceptLibrary'
import PronunciationControls from './components/PronunciationControls'
import GuidedSession from './components/GuidedSession'
import TracePad from './components/TracePad'
import RoutinesPanel from './components/RoutinesPanel'
import WeeklyReport from './components/WeeklyReport'
import RoutineRunner from './components/RoutineRunner'
import AdultGate from './components/AdultGate'
import SentenceMission from './components/SentenceMission'
import GeneralizationPanel from './components/GeneralizationPanel'
import { routineTemplates } from './data/routines'
import { listConcepts } from './services/libraryService'
import { getSessionVocabulary, getVocabularySummary, pickAdaptiveWord } from './services/vocabularyEngine'
import { applySkillProgression } from './services/skillProgression'

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
  const [showGuidedSession, setShowGuidedSession] = useState(false)
  const [showAdultGate, setShowAdultGate] = useState(false)
  const [adultUnlocked, setAdultUnlocked] = useState(false)
  const [showSentenceMission, setShowSentenceMission] = useState(false)
  const [activeRoutine, setActiveRoutine] = useState(null)
  const [traceItem, setTraceItem] = useState(null)
  const [customConcepts, setCustomConcepts] = useState([])
  const [syncStatus, setSyncStatus] = useState('connecting')
  const badge = getBadge(progress.xp)
  const recommendedMission = getRecommendedMission(progress)
  const unlockedSkillIndex = getUnlockedSkillIndex(progress)
  const allVocabulary = useMemo(() => {
    const map = new Map(builtInWordBank.map(item => [item.word, item]))
    customConcepts.forEach(item => {
      if (item?.word) {
        map.set(item.word.toUpperCase(), {
          ...item,
          word: item.word.toUpperCase(),
          source: 'custom',
          tier: Number(item.tier || 1),
        })
      }
    })
    return [...map.values()]
  }, [customConcepts])

  const trainingWords = useMemo(
    () => getSessionVocabulary(allVocabulary, progress, 8),
    [allVocabulary, progress.wordStats],
  )

  const vocabularySummary = useMemo(
    () => getVocabularySummary(allVocabulary, progress),
    [allVocabulary, progress.wordStats],
  )

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
    listConcepts().then(result => {
      if (mounted) setCustomConcepts(result.items || [])
    }).catch(() => {})
    return () => { mounted = false }
  }, [])

  const commitProgress = (next) => {
    const progressed = applySkillProgression(next)
    saveProgress(progressed)
    setProgress(progressed)
    setSyncStatus('syncing')
    saveCloudProgress(progressed)
      .then(result => setSyncStatus(result.enabled ? 'synced' : (result.reason === 'not-configured' ? 'not-configured' : 'offline')))
      .catch(() => setSyncStatus('offline'))
  }

  const startExercise = (type = 'visual') => {
    const source = trainingWords.length ? trainingWords : starterWords
    const target = pickAdaptiveWord(source, progress)
    let options = shuffle([target, ...shuffle(source.filter(w => w.id !== target.id)).slice(0, 2)])

    if (type === 'sound') {
      const targetLetter = target.word[0].toUpperCase()
      const alphabet = ['A','E','I','O','U','M','P','L','S','T','C','D','F','G']
      const distractors = shuffle(alphabet.filter(letter => letter !== targetLetter)).slice(0, 2)
      options = shuffle([targetLetter, ...distractors]).map(letter => ({ id: 'letter-' + letter, word: letter, letter }))
    }

    setExercise({ type, target, options, startedAt: Date.now() })
    setFeedback(null)
    setMode('exercise')
  }

  const answer = (word, skillId = 'visual-1') => {
    if (!exercise || feedback) return
    const correct = exercise.type === 'sound'
      ? word.letter === exercise.target.word[0].toUpperCase()
      : word.id === exercise.target.id
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

  const openAdult = (tab = 'plan') => {
    setAdultTab(tab)
    if (adultUnlocked) {
      setMode('adult')
      return
    }
    setShowAdultGate(true)
  }

  const completeRoutine = (routine) => {
    const old = progress.routineStats?.[routine.id] || { completions: 0 }
    const next = {
      ...progress,
      routineStats: {
        ...(progress.routineStats || {}),
        [routine.id]: {
          completions: old.completions + 1,
          lastAt: new Date().toISOString(),
        },
      },
      events: [
        ...(progress.events || []),
        {
          id: crypto.randomUUID(),
          at: new Date().toISOString(),
          skillId: 'autonomia-1',
          itemId: routine.id,
          correct: true,
          helpLevel: 0,
          responseMs: null,
        },
      ].slice(-600),
    }
    commitProgress(next)
    setActiveRoutine(null)
  }

  if (showAdultGate) {
    return (
      <AdultGate
        onCancel={() => setShowAdultGate(false)}
        onSuccess={() => {
          setAdultUnlocked(true)
          setShowAdultGate(false)
          setMode('adult')
        }}
      />
    )
  }

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
          <div className="top-actions"><InstallPWA /><SyncPill status={syncStatus} /><div className="badge-chip"><span>{badge.icon}</span><b>{badge.label}</b><small>{progress.xp} XP</small></div></div>
        </header>

        <div className="mobile-install"><InstallPWA /></div>
        <main className="home-grid">
          <section className="hero-panel">
            <div className="hero-orb">🦸</div>
            <div>
              <p className="kicker">MISIÓN DEL DÍA</p>
              <h2>Entrenamos un poder nuevo</h2>
              <p className="muted">Actividades cortas, claras y adaptadas. Una misión a la vez.</p>
              <button className="primary" onClick={() => setMode('child')}>Entrar a mis misiones</button>
              {progress.assessment?.status !== 'completed' && <button className="hero-link" onClick={() => openAdult('plan')}>Primero: preparar mi plan →</button>}
            </div>
          </section>

          <section className="adult-card">
            <div className="adult-icon">🧭</div>
            <div>
              <p className="kicker">MODO ADULTO</p>
              <h3>Plan, progreso y próximo paso</h3>
              <p className="muted">Vas a ver qué trabajar, por qué, cuándo avanzar y qué hacer fuera de la app.</p>
            </div>
            <button className="secondary" onClick={() => openAdult('plan')}>Abrir panel</button>
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
            <h2>{progress.assessment?.status === 'completed' ? 'Tu entrenamiento de hoy' : 'Probemos algunas misiones'}</h2>
            <p className="muted">{progress.assessment?.status === 'completed' ? 'La primera misión está elegida según tu plan actual.' : 'Un adulto puede completar primero la evaluación para personalizar el recorrido.'}</p>
          </div>

          {progress.assessment?.status === 'completed' ? (
            <section className="recommended-mission">
              <div className="recommended-icon">{recommendedMission.icon}</div>
              <div>
                <p className="kicker">MISIÓN RECOMENDADA</p>
                <h3>{recommendedMission.title}</h3>
                <p>{recommendedMission.subtitle}</p>
                <small>Estamos trabajando: {recommendedMission.curriculum.title}</small>
              </div>
              <div className="recommended-actions">
                <button className="primary" onClick={() => setShowGuidedSession(true)}>Entrenamiento guiado</button>
                <button className="recommended-secondary" onClick={() => startExercise(recommendedMission.type)}>Solo esta misión</button>
              </div>
            </section>
          ) : (
            <section className="assessment-reminder">
              <span>🧭</span>
              <div><b>Plan personalizado pendiente</b><p>Las misiones de abajo sirven para explorar. Después de la evaluación, la app va a ordenar automáticamente qué conviene trabajar primero.</p></div>
              <button className="secondary" onClick={() => openAdult('plan')}>Preparar plan</button>
            </section>
          )}

          <p className="kicker mission-library-title">OTRAS MISIONES PARA PRACTICAR</p>
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
            <button className="mission-card mission-red" onClick={() => setTraceItem(trainingWords[0] || starterWords[0])}>
              <span className="mission-icon">✍️</span>
              <span><b>Precisión</b><small>Repasá una palabra con el dedo</small></span>
              <em>TRAZO</em>
            </button>
            <button className="mission-card mission-reading" onClick={() => setShowSentenceMission(true)}>
              <span className="mission-icon">📖</span>
              <span><b>Frases</b><small>Juntamos palabras para entender mensajes</small></span>
              <em>LECTURA</em>
            </button>
            <button className="mission-card mission-routine" onClick={() => setActiveRoutine(routineTemplates[0])}>
              <span className="mission-icon">🧭</span>
              <span><b>Rutina</b><small>Practicamos un paso de la vida diaria</small></span>
              <em>AUTONOMÍA</em>
            </button>
          </div>

          <section className="power-path">
            <div>
              <p className="kicker">TU CAMINO</p>
              <h3>Los poderes se entrenan de a poco</h3>
            </div>
            <div className="path-line">
              {['🧠','👀','🔤','👂','🧩','✍️','📖','🔢','🧭'].map((x,i) => <span className={i <= unlockedSkillIndex ? 'done':''} key={i}>{x}</span>)}
            </div>
          </section>
        </main>
        {showSentenceMission && (
          <SentenceMission
            words={allVocabulary}
            progress={progress}
            onCommit={commitProgress}
            onClose={() => setShowSentenceMission(false)}
          />
        )}
        {activeRoutine && (
          <RoutineRunner
            routine={activeRoutine}
            onClose={() => setActiveRoutine(null)}
            onComplete={completeRoutine}
          />
        )}
        {showGuidedSession && (
          <GuidedSession
            words={trainingWords}
            progress={progress}
            focusMission={recommendedMission}
            onCommit={commitProgress}
            onClose={() => setShowGuidedSession(false)}
            onFinish={() => {
              const next = {
                ...progress,
                sessions: [
                  ...(progress.sessions || []),
                  { id: crypto.randomUUID(), type: 'guided', completedAt: new Date().toISOString(), focusSkill: recommendedMission.skillId },
                ],
              }
              commitProgress(next)
              setShowGuidedSession(false)
            }}
          />
        )}
        {traceItem && (
          <TracePad
            item={traceItem}
            onClose={() => setTraceItem(null)}
            onDone={(item) => {
              const next = recordAttempt(progress, {
                skillId: 'escritura-1',
                itemId: item.id || item.word,
                correct: true,
              })
              commitProgress(next)
              setTraceItem(null)
            }}
          />
        )}
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
          ['informe','Informe semanal'],
          ['sesion','Sesión de hoy'],
          ['rutinas','Rutinas'],
          ['vida-real','Vida real'],
          ['biblioteca','Biblioteca'],
        ].map(([id,label]) => (
          <button key={id} className={adultTab===id?'active':''} onClick={() => setAdultTab(id)}>{label}</button>
        ))}
      </nav>

      <main className="adult-main">
        {adultTab === 'plan' && <PlanPanel progress={progress} onStartAssessment={() => setShowAssessment(true)} />}
        {adultTab === 'ruta' && <RoutePanel progress={progress} />}
        {adultTab === 'progreso' && <ProgressPanel progress={progress} onReset={resetData} syncStatus={syncStatus} vocabularySummary={vocabularySummary} />}
        {adultTab === 'informe' && <WeeklyReport progress={progress} vocabularySummary={vocabularySummary} />}
        {adultTab === 'sesion' && <SessionPanel onStart={() => setShowGuidedSession(true)} />}
        {adultTab === 'rutinas' && <RoutinesPanel progress={progress} onStart={setActiveRoutine} onChange={commitProgress} />}
        {adultTab === 'vida-real' && <GeneralizationPanel progress={progress} words={allVocabulary} onChange={commitProgress} />}
        {adultTab === 'biblioteca' && <ConceptLibrary onLibraryChange={setCustomConcepts} />}
      </main>
      {activeRoutine && (
        <RoutineRunner
          routine={activeRoutine}
          onClose={() => setActiveRoutine(null)}
          onComplete={completeRoutine}
        />
      )}
      {showGuidedSession && (
        <GuidedSession
          words={trainingWords}
          progress={progress}
          focusMission={recommendedMission}
          onCommit={commitProgress}
          onClose={() => setShowGuidedSession(false)}
          onFinish={() => {
            const next = {
              ...progress,
              sessions: [
                ...(progress.sessions || []),
                { id: crypto.randomUUID(), type: 'guided', completedAt: new Date().toISOString(), focusSkill: recommendedMission.skillId },
              ],
            }
            commitProgress(next)
            setShowGuidedSession(false)
          }}
        />
      )}
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

  return (
    <div className="app exercise-page">
      <header className="exercise-top">
        <button className="ghost light" onClick={onBack}>← Salir</button>
        <div className="tiny-progress"><span style={{width:'42%'}} /></div>
      </header>
      <main className="exercise-card-wrap">
        <section className="exercise-card">
          <VisualCue item={exercise.target} />
          <p className="kicker">MISIÓN DE OBSERVACIÓN</p>
          <h2>{instruction}</h2>
          <PronunciationControls item={exercise.target} />

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
          <VisualCue item={exercise.target} />
          <p className="kicker">MISIÓN DE CONSTRUCCIÓN</p>
          <h2>Armá la palabra</h2>
          <div className="word-model">{exercise.target.word}</div>
          <PronunciationControls item={exercise.target} />
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

function ProgressPanel({ progress, onReset, syncStatus, vocabularySummary }) {
  const rows = starterWords.map(w => ({...w, stat: progress.wordStats[w.id]}))
  return (
    <div className="dashboard">
      <section className="cloud-card"><div><b>Estado del respaldo</b><p>{syncStatus === 'synced' ? 'El progreso de este dispositivo está sincronizado con Firebase.' : syncStatus === 'not-configured' ? 'Faltan las variables de Firebase en Netlify.' : syncStatus === 'connecting' || syncStatus === 'syncing' ? 'Estamos sincronizando el progreso…' : 'La app sigue funcionando localmente y reintentará cuando haya conexión.'}</p></div><SyncPill status={syncStatus} /></section>
      <div className="stat-card"><span>⚡</span><b>{progress.xp}</b><small>Experiencia total</small></div>
      <div className="stat-card"><span>🎯</span><b>{Object.values(progress.skillStats).reduce((a,s)=>a+s.attempts,0)}</b><small>Intentos registrados</small></div>
      <div className="stat-card"><span>📚</span><b>{vocabularySummary?.mastered || 0}</b><small>Palabras dominadas</small></div>
      <section className="vocab-summary-card">
        <div>
          <p className="kicker">VOCABULARIO ADAPTATIVO</p>
          <h3>Nivel de palabras {vocabularySummary?.tier || 1}</h3>
          <p>La app mezcla palabras nuevas, palabras en aprendizaje y repasos. No debería repetir siempre el mismo grupo.</p>
        </div>
        <div className="vocab-counters">
          <span><b>{vocabularySummary?.learning || 0}</b><small>en aprendizaje</small></span>
          <span><b>{vocabularySummary?.newAvailable || 0}</b><small>nuevas disponibles</small></span>
        </div>
        <div className="active-vocab">
          {(vocabularySummary?.active || []).map(word => <span key={word}>{word}</span>)}
        </div>
      </section>

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


function VisualCue({ item }) {
  if (item?.imageUrl) {
    return <div className="big-visual"><img src={item.imageUrl} alt="" /></div>
  }
  return <div className="big-emoji">{item?.emoji || '⭐'}</div>
}
