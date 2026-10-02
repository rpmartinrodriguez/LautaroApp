import { assessmentDomains, assessmentItems } from '../data/assessment'
import { curriculum } from '../data/curriculum'

const domainRecommendations = {
  comprension: {
    weeklyGoal: 'Consignas de un paso y luego dos pasos, usando objetos reales.',
    daily: '5 minutos de comprensión con 3–5 consignas breves.',
  },
  'lectura-visual': {
    weeklyGoal: 'Aprender 3–5 palabras muy significativas con imagen y luego sin imagen.',
    daily: '5 minutos de asociación foto → palabra y elección entre 2–3 opciones.',
  },
  'letras-sonidos': {
    weeklyGoal: 'Consolidar 2–4 correspondencias letra–sonido vinculadas a palabras conocidas.',
    daily: '5 minutos de sonidos iniciales, sin recorrer todo el abecedario.',
  },
  'construccion-escritura': {
    weeklyGoal: 'Construir 2–3 palabras con letras móviles y copiar una palabra breve.',
    daily: '5 minutos alternando letras móviles, trazos y copia con modelo.',
  },
  cantidad: {
    weeklyGoal: 'Consolidar cantidades pequeñas antes de introducir cuentas escritas.',
    daily: '5 minutos contando y entregando objetos reales.',
  },
  'memoria-atencion': {
    weeklyGoal: 'Sostener tareas breves y aumentar gradualmente instrucciones o elementos recordados.',
    daily: '3–5 minutos de memoria visual y una actividad breve sin distracciones.',
  },
  comunicacion: {
    weeklyGoal: 'Aumentar oportunidades reales para pedir, elegir, rechazar y pedir ayuda.',
    daily: 'Crear 3 situaciones cotidianas donde necesite comunicar una elección o necesidad.',
  },
  autonomia: {
    weeklyGoal: 'Elegir una rutina y reducir una ayuda por vez.',
    daily: 'Practicar la misma rutina real con apoyos visuales constantes.',
  },
}

function scoreDomain(domainId, answers) {
  const items = assessmentItems.filter(item => item.domain === domainId)
  const values = items
    .map(item => answers?.[item.id])
    .filter(value => typeof value === 'number')

  const possible = items.length * 2
  const score = values.reduce((sum, value) => sum + value, 0)
  const answered = values.length
  const ratio = possible ? score / possible : 0

  return {
    id: domainId,
    score,
    possible,
    answered,
    totalItems: items.length,
    ratio,
    percent: Math.round(ratio * 100),
  }
}

function stageFromPercent(percent) {
  if (percent >= 75) return 'fortaleza-relativa'
  if (percent >= 45) return 'en-desarrollo'
  return 'prioridad'
}

export function buildAssessmentSummary(answers = {}) {
  const domains = assessmentDomains
    .map(domain => ({
      ...domain,
      ...scoreDomain(domain.id, answers),
    }))
    .map(domain => ({
      ...domain,
      stage: stageFromPercent(domain.percent),
    }))

  const complete = assessmentItems.every(item => typeof answers[item.id] === 'number')

  const orderedNeeds = [...domains].sort((a, b) => {
    if (a.percent !== b.percent) return a.percent - b.percent
    return a.order - b.order
  })

  const primary = orderedNeeds[0]
  const priorities = orderedNeeds.slice(0, 3)
  const strengths = [...domains]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 2)

  const mappedSkill = curriculum.find(item => item.id === primary?.skillId) || curriculum[0]

  return {
    complete,
    domains,
    primaryDomain: primary?.id || 'comprension',
    currentSkill: mappedSkill.id,
    priorities: priorities.map(item => item.id),
    strengths: strengths.map(item => item.id),
    generatedAt: new Date().toISOString(),
  }
}

export function buildPersonalPlan(summary) {
  if (!summary) return null

  const domainMap = Object.fromEntries(summary.domains.map(domain => [domain.id, domain]))
  const primary = domainMap[summary.primaryDomain] || summary.domains[0]
  const priorities = summary.priorities.map(id => domainMap[id]).filter(Boolean)
  const strengths = summary.strengths.map(id => domainMap[id]).filter(Boolean)

  return {
    title: 'Plan inicial de Lautaro',
    primary: {
      ...primary,
      recommendation: domainRecommendations[primary.id],
    },
    priorities: priorities.map(item => ({
      ...item,
      recommendation: domainRecommendations[item.id],
    })),
    strengths,
    session: [
      { minutes: 5, label: 'Éxito conocido', detail: 'Repasar una habilidad ya conseguida.' },
      { minutes: 5, label: 'Prioridad principal', detail: domainRecommendations[primary.id]?.daily || 'Actividad breve guiada.' },
      { minutes: 5, label: 'Segundo objetivo', detail: priorities[1] ? domainRecommendations[priorities[1].id]?.daily : 'Repaso funcional.' },
      { minutes: 5, label: 'Juego cognitivo', detail: 'Memoria, atención o cantidad con material concreto.' },
      { minutes: 5, label: 'Vida real', detail: 'Usar fuera de la pantalla lo practicado hoy.' },
    ],
    rule: 'Subir la dificultad cuando la habilidad se mantiene en distintos días con menos ayuda. Si aparece frustración o baja mucho el rendimiento, volver temporalmente al último paso estable.',
  }
}

export function getDomainRecommendation(domainId) {
  return domainRecommendations[domainId]
}
