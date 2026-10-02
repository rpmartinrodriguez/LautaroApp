import { curriculum } from '../data/curriculum'

export function shouldAdvanceCurrentSkill(progress) {
  if (progress?.assessment?.status !== 'completed') return false

  const skillId = progress.currentSkill || 'comprension-1'
  const stat = progress?.skillStats?.[skillId]
  if (!stat || stat.attempts < 10) return false

  const totalAccuracy = stat.correct / stat.attempts
  const recent = Array.isArray(stat.recentResults) ? stat.recentResults : []
  const recentAccuracy = recent.length
    ? recent.filter(Boolean).length / recent.length
    : totalAccuracy

  return totalAccuracy >= 0.8 && recentAccuracy >= 0.8 && (stat.correctStreak || 0) >= 3
}

export function applySkillProgression(progress) {
  if (!shouldAdvanceCurrentSkill(progress)) return progress

  const currentSkill = progress.currentSkill || 'comprension-1'
  const current = curriculum.find(item => item.id === currentSkill)
  const nextSkill = current?.next

  if (!nextSkill || !curriculum.some(item => item.id === nextSkill)) {
    return progress
  }

  const history = Array.isArray(progress.skillHistory) ? progress.skillHistory : []
  const transitionAlreadySaved = history.some(item => item.from === currentSkill && item.to === nextSkill)

  return {
    ...progress,
    currentSkill: nextSkill,
    skillHistory: transitionAlreadySaved
      ? history
      : [
          ...history,
          {
            from: currentSkill,
            to: nextSkill,
            advancedAt: new Date().toISOString(),
          },
        ],
  }
}
