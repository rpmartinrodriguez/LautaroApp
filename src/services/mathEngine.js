export function getQuantityMax(progress) {
  const stat = progress?.skillStats?.['matematica-1']
  if (!stat?.attempts) return 3

  const accuracy = stat.correct / stat.attempts

  if (stat.attempts >= 18 && accuracy >= 0.8) return 10
  if (stat.attempts >= 8 && accuracy >= 0.75) return 5
  return 3
}

export function quantityOptions(target, max) {
  const values = new Set([target])
  while (values.size < Math.min(5, max)) {
    values.add(1 + Math.floor(Math.random() * max))
  }
  return [...values].sort(() => Math.random() - 0.5)
}
