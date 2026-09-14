import { EMERGENCY_TOOLS } from './data'

export function parseEntries(text) {
  if (!text) return []
  return text
    .split(/\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function uniqueEntries(items) {
  const seen = new Set()
  return items.filter((item) => {
    const key = item.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function extractEmergencyChoices(plan) {
  const helpful = []
  const harmful = []

  EMERGENCY_TOOLS.forEach((tool) => {
    const row = plan.emergencyNeeds?.[tool.id] || { helpful: '', harmful: '' }
    helpful.push(...parseEntries(row.helpful))
    harmful.push(...parseEntries(row.harmful))
  })

  return {
    helpful: uniqueEntries(helpful),
    harmful: uniqueEntries(harmful),
  }
}
