import React, { useState } from 'react'

const quickPhrases = [
  { id:'quiero-agua', icon:'💧', text:'QUIERO AGUA' },
  { id:'quiero-comer', icon:'🍽️', text:'QUIERO COMER' },
  { id:'bano', icon:'🚻', text:'QUIERO IR AL BAÑO' },
  { id:'ayuda', icon:'🤝', text:'AYUDA' },
  { id:'si', icon:'✅', text:'SÍ' },
  { id:'no', icon:'🚫', text:'NO' },
  { id:'cansado', icon:'🥱', text:'ESTOY CANSADO' },
  { id:'contento', icon:'😊', text:'ESTOY CONTENTO' },
]

function speak(text, slow = false) {
  if (!('speechSynthesis' in window)) return
  speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text.toLowerCase())
  utterance.lang = 'es-AR'
  utterance.rate = slow ? 0.52 : 0.72
  speechSynthesis.speak(utterance)
}

export default function CommunicationBoard({ onClose }) {
  const [selected, setSelected] = useState(null)

  const choose = phrase => {
    setSelected(phrase)
    speak(phrase.text)
  }

  return (
    <div className="guided-overlay">
      <div className="communication-shell">
        <header>
          <button className="ghost" onClick={onClose}>× Salir</button>
          <div><p className="kicker">COMUNICAR</p><h2>Decir lo que necesito</h2></div>
        </header>

        <div className="communication-grid">
          {quickPhrases.map(phrase => (
            <button key={phrase.id} onClick={() => choose(phrase)}>
              <span>{phrase.icon}</span>
              <b>{phrase.text}</b>
            </button>
          ))}
        </div>

        {selected && (
          <div className="communication-selected">
            <span>{selected.icon}</span>
            <b>{selected.text}</b>
            <div>
              <button className="secondary" onClick={() => speak(selected.text)}>🔊 Escuchar</button>
              <button className="secondary" onClick={() => speak(selected.text, true)}>🐢 Despacio</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
