import { accuracy } from './progressEngine'

const MASTER_ATTEMPTS = 6
const MASTER_STREAK = 3
const ACTIVE_NEW_LIMIT = 2

function statFor(progress, word) {
  return progress?.wordStats?.[word.id] || progress?.wordStats?.[word.word] || null
}

export function wordLearningStatus(progress, word) {
  const stat = statFor(progress, word)
  if (!stat?.attempts) return 'new'

  const acc = accuracy(stat)
  const recent = Array.isArray(stat.recentResults) ? stat.recentResults : []
  const recentAccuracy = recent.length
    ? Math.round((recent.filter(Boolean).length / recent.length) * 100)
    : acc

  if (
    stat.attempts >= MASTER_ATTEMPTS &&
    acc >= 80 &&
    recentAccuracy >= 80 &&
    (stat.correctStreak || 0) >= MASTER_STREAK
  ) return 'mastered'

  if (acc < 60 && stat.attempts >= 4) return 'needs-help'
  return 'learning'
}

export function getUnlockedVocabularyTier(progress, words = []) {
  const masteredCount = words.filter(word => {
    const stat = statFor(progress, word)
    if (!stat?.attempts) return false
    const acc = Math.round((stat.correct / stat.attempts) * 100)
    const recent = Array.isArray(stat.recentResults) ? stat.recentResults : []
    const recentAccuracy = recent.length
      ? Math.round((recent.filter(Boolean).length / recent.length) * 100)
      : acc
    return stat.attempts >= MASTER_ATTEMPTS && acc >= 80 && recentAccuracy >= 80 && (stat.correctStreak || 0) >= MASTER_STREAK
  }).length

  if (masteredCount >= 28) return 5
  if (masteredCount >= 18) return 4
  if (masteredCount >= 10) return 3
  if (masteredCount >= 4) return 2
  return 1
}

export function buildVocabularyState(words, progress) {
  const unlockedTier = getUnlockedVocabularyTier(progress, words)

  const normalized = words.map((word, index) => ({
    ...word,
    tier: Number(word.tier || 1),
    sortIndex: index,
    learningStatus: wordLearningStatus(progress, word),
    stat: statFor(progress, word),
  }))

  const eligible = normalized.filter(word => word.tier <= unlockedTier || word.source === 'custom')
  const mastered = eligible.filter(word => word.learningStatus === 'mastered')
  const learning = eligible.filter(word => word.learningStatus === 'learning' || word.learningStatus === 'needs-help')
  const newWords = eligible.filter(word => word.learningStatus === 'new')

  return { unlockedTier, eligible, mastered, learning, newWords }
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function unique(items) {
  const map = new Map()
  items.forEach(item => map.set(item.id || item.word, item))
  return [...map.values()]
}

export function getSessionVocabulary(words, progress, size = 6) {
  const state = buildVocabularyState(words, progress)

  const struggling = state.learning
    .filter(word => word.learningStatus === 'needs-help')
    .sort((a,b) => (a.stat?.lastAt || '').localeCompare(b.stat?.lastAt || ''))

  const activeLearning = shuffle(state.learning.filter(word => word.learningStatus !== 'needs-help')).sort((a,b) => Number(Boolean(b.priority)) - Number(Boolean(a.priority)))
  const review = shuffle(state.mastered)
  const newCandidates = state.newWords
    .sort((a,b) => Number(Boolean(b.priority)) - Number(Boolean(a.priority)) || a.tier - b.tier || a.sortIndex - b.sortIndex)
    .slice(0, ACTIVE_NEW_LIMIT)

  const selected = unique([
    ...struggling.slice(0, 2),
    ...activeLearning.slice(0, 3),
    ...newCandidates,
    ...review.slice(0, 2),
  ]).slice(0, size)

  if (selected.length < Math.min(size, state.eligible.length)) {
    const fill = shuffle(state.eligible.filter(word => !selected.some(chosen => chosen.id === word.id)))
    selected.push(...fill.slice(0, size - selected.length))
  }

  return selected.length ? selected : words.slice(0, size)
}

export function pickAdaptiveWord(words, progress) {
  const pool = getSessionVocabulary(words, progress, 6)
  const weighted = []

  pool.forEach(word => {
    const status = wordLearningStatus(progress, word)
    const baseWeight = status === 'needs-help' ? 5 : status === 'learning' ? 4 : status === 'new' ? 3 : 1
    const weight = baseWeight + (word.priority ? 2 : 0)
    for (let i = 0; i < weight; i += 1) weighted.push(word)
  })

  return weighted[Math.floor(Math.random() * weighted.length)] || pool[0] || words[0]
}

export function getVocabularySummary(words, progress) {
  const state = buildVocabularyState(words, progress)
  return {
    tier: state.unlockedTier,
    mastered: state.mastered.length,
    learning: state.learning.length,
    newAvailable: state.newWords.length,
    active: getSessionVocabulary(words, progress, 6).map(word => word.word),
  }
}
