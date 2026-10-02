import React, { useMemo, useState } from 'react'

const types = [
  ['reconocio','Reconoció la palabra'],
  ['pidio','La usó para pedir'],
  ['nombro','La nombró espontáneamente'],
  ['leyo','La leyó fuera de la app'],
  ['escribio','La escribió o copió'],
]

export default function GeneralizationPanel({ progress, words, onChange }) {
  const [wordId, setWordId] = useState(words[0]?.id || '')
  const [type, setType] = useState('reconocio')
  const [note, setNote] = useState('')

  const logs = useMemo(
    () => [...(progress.generalizationLogs || [])].sort((a,b) => b.at.localeCompare(a.at)),
    [progress.generalizationLogs]
  )

  const save = event => {
    event.preventDefault()
    const word = words.find(item => item.id === wordId) || words[0]
    if (!word) return

    const log = {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      wordId: word.id,
      word: word.word,
      type,
      note: note.trim(),
    }

    onChange({
      ...progress,
      generalizationLogs: [...(progress.generalizationLogs || []), log],
    })
    setNote('')
  }

  return (
    <div className="generalization-panel">
      <section className="generalization-builder">
        <p className="kicker">VIDA REAL</p>
        <h2>Registrar cuando lo aprendido aparece fuera de la app</h2>
        <p className="muted">Esto nos ayuda a diferenciar “lo reconoce en el juego” de “lo usa espontáneamente en la vida diaria”.</p>
        <form onSubmit={save}>
          <select value={wordId} onChange={e => setWordId(e.target.value)}>
            {words.map(word => <option key={word.id} value={word.id}>{word.word}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)}>
            {types.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota opcional: dónde ocurrió, con quién…" />
          <button className="primary">Guardar logro real</button>
        </form>
      </section>

      <section className="generalization-list">
        <h3>Últimos registros</h3>
        {logs.length === 0 ? (
          <p className="muted">Todavía no hay registros de generalización.</p>
        ) : logs.slice(0,20).map(log => {
          const label = types.find(item => item[0] === log.type)?.[1] || log.type
          return (
            <div key={log.id}>
              <span>🌟</span>
              <div><b>{log.word}</b><small>{label}{log.note ? ' · ' + log.note : ''}</small></div>
              <time>{new Date(log.at).toLocaleDateString('es-AR')}</time>
            </div>
          )
        })}
      </section>
    </div>
  )
}
