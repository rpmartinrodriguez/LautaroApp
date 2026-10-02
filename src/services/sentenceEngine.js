import { wordLearningStatus } from './vocabularyEngine'

export const sentenceTemplates = [
  { id:'quiero-agua', text:'QUIERO AGUA', words:['QUIERO','AGUA'], emoji:'🙋 💧' },
  { id:'quiero-pan', text:'QUIERO PAN', words:['QUIERO','PAN'], emoji:'🙋 🍞' },
  { id:'lautaro-toma-agua', text:'LAUTARO TOMA AGUA', words:['LAUTARO','TOMA','AGUA'], emoji:'🦸 🥤 💧' },
  { id:'lautaro-come-pan', text:'LAUTARO COME PAN', words:['LAUTARO','COME','PAN'], emoji:'🦸 🍽️ 🍞' },
  { id:'mama-toma-agua', text:'MAMÁ TOMA AGUA', words:['MAMÁ','TOMA','AGUA'], emoji:'❤️ 🥤 💧' },
  { id:'lautaro-corre', text:'LAUTARO CORRE', words:['LAUTARO','CORRE'], emoji:'🦸 🏃' },
  { id:'mama-mira', text:'MAMÁ MIRA', words:['MAMÁ','MIRA'], emoji:'❤️ 👀' },
  { id:'quiero-ayuda', text:'QUIERO AYUDA', words:['QUIERO','AYUDA'], emoji:'🙋 🤝' },
  { id:'lautaro-esta-contento', text:'LAUTARO CONTENTO', words:['LAUTARO','CONTENTO'], emoji:'🦸 😊' },
  { id:'primero-mochila', text:'PRIMERO MOCHILA', words:['PRIMERO','MOCHILA'], emoji:'1️⃣ 🎒' },
]

function normalize(text) {
  return String(text || '').trim().toUpperCase()
}

export function getAvailableSentences(words, progress) {
  const known = new Set(
    words
      .filter(word => ['mastered','learning'].includes(wordLearningStatus(progress, word)))
      .map(word => normalize(word.word))
  )

  return sentenceTemplates.filter(sentence =>
    sentence.words.every(word => known.has(normalize(word)))
  )
}

export function sentenceUnlocked(words, progress) {
  return getAvailableSentences(words, progress).length > 0
}
