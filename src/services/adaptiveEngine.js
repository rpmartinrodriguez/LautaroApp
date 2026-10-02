import { curriculum } from '../data/curriculum'

const skillToMission = {
  'comprension-1': {
    type: 'visual',
    icon: '🧠',
    title: 'Misión de comprensión',
    subtitle: 'Escuchá, mirá y elegí',
    area: 'Comprensión',
  },
  'visual-1': {
    type: 'visual',
    icon: '👀',
    title: 'Misión de observación',
    subtitle: 'Encontrá la palabra correcta',
    area: 'Lectura visual',
  },
  'visual-2': {
    type: 'visual',
    icon: '🔤',
    title: 'Misión de palabras',
    subtitle: 'Reconocé palabras sin ayuda',
    area: 'Lectura visual',
  },
  'fonologia-1': {
    type: 'sound',
    icon: '👂',
    title: 'Misión de sonidos',
    subtitle: 'Escuchá y elegí la letra',
    area: 'Sonidos',
  },
  'construccion-1': {
    type: 'build',
    icon: '🧩',
    title: 'Misión de construcción',
    subtitle: 'Armá una palabra conocida',
    area: 'Construcción',
  },
  'escritura-1': {
    type: 'build',
    icon: '✍️',
    title: 'Misión de escritura',
    subtitle: 'Primero construimos, después copiamos',
    area: 'Escritura',
  },
  'frases-1': {
    type: 'visual',
    icon: '📖',
    title: 'Misión de lectura',
    subtitle: 'Palabras que forman un mensaje',
    area: 'Lectura',
  },
  'memoria-1': {
    type: 'memory',
    icon: '🎯',
    title: 'Misión de memoria',
    subtitle: 'Mirá, recordá y elegí',
    area: 'Memoria y atención',
  },
  'matematica-1': {
    type: 'quantity',
    icon: '🔢',
    title: 'Misión de cantidad',
    subtitle: 'Contá y elegí',
    area: 'Matemática',
  },
  'autonomia-1': {
    type: 'visual',
    icon: '🧭',
    title: 'Misión de autonomía',
    subtitle: 'Pasos de una rutina real',
    area: 'Autonomía',
  },
}

export function getRecommendedMission(progress) {
  const skillId = progress?.currentSkill || 'comprension-1'
  const curriculumItem = curriculum.find(item => item.id === skillId) || curriculum[0]
  return {
    skillId: curriculumItem.id,
    curriculum: curriculumItem,
    ...(skillToMission[curriculumItem.id] || skillToMission['comprension-1']),
  }
}

export function getUnlockedSkillIndex(progress) {
  const current = progress?.currentSkill || 'comprension-1'
  const index = curriculum.findIndex(item => item.id === current)
  return Math.max(0, index)
}

export function shouldAdvanceSkill(progress, skillId) {
  const stat = progress?.skillStats?.[skillId]
  if (!stat || stat.attempts < 10) return false

  const accuracy = stat.correct / stat.attempts
  return accuracy >= 0.8
}

export function getNextSkillId(skillId) {
  const item = curriculum.find(entry => entry.id === skillId)
  return item?.next || null
}
