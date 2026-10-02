import React, { useMemo, useState } from 'react'
import {
  getSyllables,
  speakNormal,
  speakRepeatAfterMe,
  speakSlow,
  speakSyllables,
  stopSpeech,
} from '../services/speechService'

export default function PronunciationControls({ item, compact = false }) {
  const [playing, setPlaying] = useState('')
  const syllables = useMemo(() => getSyllables(item), [item?.word, item?.syllables?.join?.('|')])

  const run = async (mode, fn) => {
    setPlaying(mode)
    try {
      await fn(item)
    } finally {
      setPlaying('')
    }
  }

  const stop = () => {
    stopSpeech()
    setPlaying('')
  }

  if (!item?.word) return null

  return (
    <div className={'pronunciation-box ' + (compact ? 'compact' : '')}>
      {!compact && (
        <div className="pronunciation-syllables">
          {syllables.map((syllable, index) => (
            <span key={index}>{syllable}</span>
          ))}
        </div>
      )}

      <div className="pronunciation-actions">
        <button
          type="button"
          className={playing === 'normal' ? 'playing' : ''}
          onClick={() => run('normal', speakNormal)}
          title="Escuchar palabra"
        >
          🔊 <span>{compact ? '' : 'Normal'}</span>
        </button>
        <button
          type="button"
          className={playing === 'slow' ? 'playing' : ''}
          onClick={() => run('slow', speakSlow)}
          title="Escuchar despacio"
        >
          🐢 <span>{compact ? '' : 'Despacio'}</span>
        </button>
        <button
          type="button"
          className={playing === 'syllables' ? 'playing' : ''}
          onClick={() => run('syllables', speakSyllables)}
          title="Escuchar por sílabas"
        >
          👏 <span>{compact ? '' : 'Sílabas'}</span>
        </button>
        {!compact && (
          <button
            type="button"
            className={playing === 'repeat' ? 'playing' : ''}
            onClick={() => run('repeat', speakRepeatAfterMe)}
            title="Modo repetición"
          >
            🎙️ <span>Repetí conmigo</span>
          </button>
        )}
        {playing && <button type="button" className="stop-speech" onClick={stop}>■</button>}
      </div>
    </div>
  )
}
