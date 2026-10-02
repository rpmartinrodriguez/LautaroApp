let cachedVoice = null

function normalizeSyllables(item) {
  if (Array.isArray(item?.syllables) && item.syllables.length) {
    return item.syllables.map(value => String(value).trim()).filter(Boolean)
  }

  const word = String(item?.word || '').trim()
  if (!word) return []

  // Fallback simple para palabras sin separación manual.
  // La Biblioteca permite cargar las sílabas correctas y tiene prioridad.
  const clean = word.toUpperCase()
  const vowels = 'AEIOUÁÉÍÓÚÜ'
  const chunks = []
  let current = ''

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i]
    current += char

    if (char === ' ') {
      if (current.trim()) chunks.push(current.trim())
      current = ''
      continue
    }

    const isVowel = vowels.includes(char)
    if (!isVowel) continue

    const next = clean[i + 1]
    const after = clean[i + 2]
    const nextIsConsonant = next && next !== ' ' && !vowels.includes(next)
    const afterIsVowel = after && vowels.includes(after)

    if (!next || next === ' ') {
      chunks.push(current)
      current = ''
    } else if (nextIsConsonant && afterIsVowel) {
      chunks.push(current)
      current = ''
    }
  }

  if (current.trim()) chunks.push(current.trim())
  return chunks.length > 1 ? chunks : [clean]
}

function pickSpanishVoice() {
  if (!('speechSynthesis' in window)) return null
  if (cachedVoice) return cachedVoice

  const voices = window.speechSynthesis.getVoices()
  cachedVoice =
    voices.find(voice => voice.lang?.toLowerCase() === 'es-ar') ||
    voices.find(voice => voice.lang?.toLowerCase().startsWith('es-ar')) ||
    voices.find(voice => voice.lang?.toLowerCase().startsWith('es')) ||
    null

  return cachedVoice
}

function utter(text, { rate = 0.78, pitch = 1, volume = 1 } = {}) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window) || !text) {
      resolve()
      return
    }

    const message = new SpeechSynthesisUtterance(text)
    message.lang = 'es-AR'
    message.rate = rate
    message.pitch = pitch
    message.volume = volume

    const voice = pickSpanishVoice()
    if (voice) message.voice = voice

    message.onend = () => resolve()
    message.onerror = () => resolve()
    window.speechSynthesis.speak(message)
  })
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function stopSpeech() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

export async function speakNormal(item) {
  stopSpeech()
  await utter(String(item?.word || ''), { rate: 0.78 })
}

export async function speakSlow(item) {
  stopSpeech()
  await utter(String(item?.word || ''), { rate: 0.5 })
}

export async function speakSyllables(item, pauseMs = 650) {
  stopSpeech()
  const syllables = normalizeSyllables(item)

  for (let i = 0; i < syllables.length; i += 1) {
    await utter(syllables[i].toLowerCase(), { rate: 0.58 })
    if (i < syllables.length - 1) await wait(pauseMs)
  }

  await wait(450)
  await utter(String(item?.word || '').toLowerCase(), { rate: 0.68 })
}

export async function speakRepeatAfterMe(item) {
  stopSpeech()
  const syllables = normalizeSyllables(item)

  await utter('Escuchá.', { rate: 0.72 })
  await wait(250)

  for (const syllable of syllables) {
    await utter(syllable.toLowerCase(), { rate: 0.55 })
    await wait(850)
  }

  await utter('Ahora juntos.', { rate: 0.72 })
  await wait(250)
  await utter(String(item?.word || '').toLowerCase(), { rate: 0.58 })
}

export function getSyllables(item) {
  return normalizeSyllables(item)
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null
    pickSpanishVoice()
  })
}
