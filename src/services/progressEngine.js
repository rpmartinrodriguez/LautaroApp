const KEY = 'lautaro-progress-v1'

export const defaultProgress = {
  xp: 0,
  streak: 0,
  currentSkill: 'comprension-1',
  sessions: [],
  wordStats: {},
  skillStats: {},
}

export function loadProgress() {
  try {
    return { ...defaultProgress, ...(JSON.parse(localStorage.getItem(KEY)) || {}) }
  } catch {
    return defaultProgress
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function recordAttempt(progress, { skillId, itemId, correct, helpLevel = 0, responseMs = null }) {
  const key = itemId || skillId
  const old = progress.wordStats[key] || { attempts: 0, correct: 0, help: 0 }
  const wordStats = {
    ...progress.wordStats,
    [key]: {
      attempts: old.attempts + 1,
      correct: old.correct + (correct ? 1 : 0),
      help: old.help + helpLevel,
      lastAt: new Date().toISOString(),
    },
  }

  const skillOld = progress.skillStats[skillId] || { attempts: 0, correct: 0 }
  const skillStats = {
    ...progress.skillStats,
    [skillId]: {
      attempts: skillOld.attempts + 1,
      correct: skillOld.correct + (correct ? 1 : 0),
      lastAt: new Date().toISOString(),
      responseMs,
    },
  }

  const next = {
    ...progress,
    xp: progress.xp + (correct ? 5 : 1),
    wordStats,
    skillStats,
  }
  saveProgress(next)
  return next
}

export function accuracy(stat) {
  if (!stat?.attempts) return 0
  return Math.round((stat.correct / stat.attempts) * 100)
}

export function masteryStatus(stat) {
  const value = accuracy(stat)
  if (!stat || stat.attempts < 5) return 'inicial'
  if (value >= 80) return 'avanzando'
  if (value >= 60) return 'practicando'
  return 'reforzar'
}
