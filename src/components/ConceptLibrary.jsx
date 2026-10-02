import React, { useEffect, useMemo, useState } from 'react'
import { createConcept, listConcepts, removeConcept } from '../services/libraryService'

const categories = ['Personas', 'Casa', 'Comida', 'Objetos', 'Acciones', 'Héroes', 'Personal']

export default function ConceptLibrary({ onLibraryChange }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cloud, setCloud] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    word: '',
    emoji: '⭐',
    category: 'Personal',
    syllables: '',
    priority: false,
  })
  const [imageFile, setImageFile] = useState(null)
  const [filter, setFilter] = useState('Todas')

  const refresh = async () => {
    setLoading(true)
    const result = await listConcepts()
    setItems(result.items)
    setCloud(result.cloud)
    onLibraryChange?.(result.items)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'Todas') return items
    return items.filter(item => item.category === filter)
  }, [items, filter])

  const submit = async (event) => {
    event.preventDefault()
    if (!form.word.trim()) return

    setSaving(true)
    setMessage('')
    const result = await createConcept(form, imageFile)
    setItems(prev => [...prev.filter(item => item.id !== result.concept.id), result.concept].sort((a,b) => a.word.localeCompare(b.word, 'es')))
    onLibraryChange?.([...items, result.concept])
    setCloud(result.cloud)
    setForm({ word: '', emoji: '⭐', category: 'Personal', syllables: '', priority: false })
    setImageFile(null)
    setMessage(result.cloud ? 'Concepto guardado y sincronizado.' : 'Concepto guardado en este dispositivo. La foto necesita conexión para subirse.')
    setSaving(false)
  }

  const remove = async (item) => {
    if (!confirm('¿Eliminar “' + item.word + '” de la biblioteca?')) return
    setItems(prev => prev.filter(value => value.id !== item.id))
    onLibraryChange?.(items.filter(value => value.id !== item.id))
    await removeConcept(item)
  }

  const speak = word => {
    if (!('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word.toLowerCase())
    utterance.lang = 'es-AR'
    utterance.rate = 0.75
    speechSynthesis.speak(utterance)
  }

  return (
    <div className="concept-library">
      <section className="library-builder">
        <div>
          <p className="kicker">BIBLIOTECA PERSONAL</p>
          <h2>Convertí su mundo real en material de aprendizaje</h2>
          <p className="muted">Cargá palabras importantes para Lautaro. Si agregás una foto real, la app puede usar ese concepto en futuras misiones.</p>
        </div>

        <form onSubmit={submit} className="concept-form">
          <label>
            <span>Palabra</span>
            <input value={form.word} onChange={e => setForm({...form, word:e.target.value})} placeholder="Ej: MOCHILA" maxLength={30} required />
          </label>
          <label>
            <span>Emoji / símbolo</span>
            <input value={form.emoji} onChange={e => setForm({...form, emoji:e.target.value})} placeholder="🎒" maxLength={8} />
          </label>
          <label>
            <span>Categoría</span>
            <select value={form.category} onChange={e => setForm({...form, category:e.target.value})}>
              {categories.map(category => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>
            <span>Sílabas opcionales</span>
            <input value={form.syllables} onChange={e => setForm({...form, syllables:e.target.value})} placeholder="MO-CHI-LA" />
          </label>
          <label className="priority-field">
            <span>Prioridad</span>
            <div className="priority-toggle">
              <input type="checkbox" checked={form.priority} onChange={e => setForm({...form, priority:e.target.checked})} />
              <small>Hacer que aparezca más seguido mientras la aprende.</small>
            </div>
          </label>
          <label className="photo-field">
            <span>Foto real (opcional)</span>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
            <small>{imageFile ? imageFile.name : 'Usá una foto simple, clara y sin demasiados objetos alrededor.'}</small>
          </label>
          <button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Agregar a la biblioteca'}</button>
        </form>
        {message && <div className="library-message">{message}</div>}
      </section>

      <section className="library-collection">
        <div className="collection-head">
          <div>
            <p className="kicker">CONCEPTOS ACTIVOS</p>
            <h3>{items.length} palabras personalizadas</h3>
          </div>
          <div className={'library-cloud ' + (cloud ? 'online' : 'local')}>{cloud ? '☁️ Sincronizada' : '📱 Copia local'}</div>
        </div>

        <div className="library-filters">
          {['Todas', ...categories].map(category => (
            <button key={category} className={filter === category ? 'active' : ''} onClick={() => setFilter(category)}>{category}</button>
          ))}
        </div>

        {loading ? (
          <div className="library-empty">Cargando biblioteca…</div>
        ) : filtered.length === 0 ? (
          <div className="library-empty">Todavía no hay conceptos en esta categoría.</div>
        ) : (
          <div className="concept-grid">
            {filtered.map(item => (
              <article className="concept-card" key={item.id}>
                <div className="concept-visual">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>{item.emoji || '⭐'}</span>}
                </div>
                <div className="concept-info">
                  <b>{item.word}</b>
                  <small>{item.priority ? '⭐ Prioridad · ' : ''}{item.category || 'Personal'}{item.syllables?.length ? ' · ' + item.syllables.join('-') : ''}</small>
                </div>
                <div className="concept-actions">
                  <button onClick={() => speak(item.word)} title="Escuchar">🔊</button>
                  <button onClick={() => remove(item)} title="Eliminar">🗑️</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
