const KEY = 'lautaro-progress-v1'

export const defaultAssessment = {
  status: 'not-started',
  answers: {},
  startedAt: null,
  completedAt: null,
  summary: null,
  plan: null,
}

export const defaultProgress = {
  xp: 0,
  streak: 0,
  currentSkill: 'comprension-1',
  sessions: [],
  events: [],
  wordStats: {},
  skillStats: {},
  assessment: defaultAssessment,
}

export function loadProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY)) || {}
    return {
      ...defaultProgress,
      ...stored,
      assessment: {
        ...defaultAssessment,
        ...(stored.assessment || {}),
        answers: stored.assessment?.answers || {},
      },
      sessions: stored.sessions || [],
      events: stored.events || [],
      wordStats: stored.wordStats || {},
      skillStats: stored.skillStats || {},
    }
  } catch {
    return {
      ...defaultProgress,
      assessment: { ...defaultAssessment },
    }
  }
}

export function saveProgress(progress) {
  localStorage.setItem(KEY, JSON.stringify(progress))
}

export function recordAttempt(progress, { skillId, itemId, correct, helpLevel = 0, responseMs = null }) {
  const key = itemId || skillId
  const old = progress.wordStats[key] || {
    attempts: 0,
    correct: 0,
    help: 0,
    correctStreak: 0,
    recentResults: [],
    help: 0,
  }

  const shouldTrackWord = !String(key).startsWith('cantidad-')
  const wordStats = shouldTrackWord
    ? {
        ...progress.wordStats,
        [key]: {
          attempts: old.attempts + 1,
          correct: old.correct + (correct ? 1 : 0),
          help: (old.help || 0) + helpLevel,
          correctStreak: correct ? (old.correctStreak || 0) + 1 : 0,
          recentResults: [...(old.recentResults || []), !!correct].slice(-5),
          lastAt: new Date().toISOString(),
        },
      }
    : progress.wordStats

  const skillOld = progress.skillStats[skillId] || {
    attempts: 0,
    correct: 0,
    correctStreak: 0,
    recentResults: [],
  }

  const skillStats = {
    ...progress.skillStats,
    [skillId]: {
      attempts: skillOld.attempts + 1,
      correct: skillOld.correct + (correct ? 1 : 0),
      help: (skillOld.help || 0) + helpLevel,
      correctStreak: correct ? (skillOld.correctStreak || 0) + 1 : 0,
      recentResults: [...(skillOld.recentResults || []), !!correct].slice(-5),
      lastAt: new Date().toISOString(),
      responseMs,
    },
  }

  const event = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    skillId,
    itemId: key,
    correct: !!correct,
    helpLevel,
    responseMs,
  }

  const next = {
    ...progress,
    xp: progress.xp + (correct ? 5 : 1),
    wordStats,
    skillStats,
    events: [...(progress.events || []), event].slice(-600),
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
