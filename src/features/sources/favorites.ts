import type { LocalVodSource } from '@/core/models'
import { loadAllSources } from './storage'

const FAVORITE_SOURCES_KEY = 'tvcc_favorite_sources'
const FAVORITE_VERSION_KEY = 'tvcc_favorite_version'
const CURRENT_FAVORITE_VERSION = 2 // 强制同步

// Default favorite sources
const DEFAULT_FAVORITES = ['iqiyizy', 'ikunzy', 'p2100', 'ruyi', 'ffzy5']

export function getFavoriteSourceKeys(): string[] {
  try {
    // Check version for forced sync
    const savedVersion = localStorage.getItem(FAVORITE_VERSION_KEY)
    if (savedVersion !== String(CURRENT_FAVORITE_VERSION)) {
      // Version mismatch — update favorites
      const raw = localStorage.getItem(FAVORITE_SOURCES_KEY)
      let existingFavorites: string[] = []

      if (raw) {
        try {
          existingFavorites = JSON.parse(raw) as string[]
        } catch {
          existingFavorites = []
        }
      }

      // Merge: add any new default favorites
      const merged = [...new Set([...DEFAULT_FAVORITES, ...existingFavorites])]
      localStorage.setItem(FAVORITE_SOURCES_KEY, JSON.stringify(merged))
      localStorage.setItem(FAVORITE_VERSION_KEY, String(CURRENT_FAVORITE_VERSION))
      return merged
    }

    const raw = localStorage.getItem(FAVORITE_SOURCES_KEY)
    if (!raw) {
      // First time — save defaults
      localStorage.setItem(FAVORITE_SOURCES_KEY, JSON.stringify(DEFAULT_FAVORITES))
      return DEFAULT_FAVORITES
    }
    return JSON.parse(raw) as string[]
  } catch {
    return DEFAULT_FAVORITES
  }
}

export function saveFavoriteSourceKeys(keys: string[]): void {
  localStorage.setItem(FAVORITE_SOURCES_KEY, JSON.stringify(keys))
}

export function addFavoriteSource(key: string): void {
  const keys = getFavoriteSourceKeys()
  if (!keys.includes(key)) {
    keys.push(key)
    saveFavoriteSourceKeys(keys)
  }
}

export function removeFavoriteSource(key: string): void {
  const keys = getFavoriteSourceKeys().filter(k => k !== key)
  saveFavoriteSourceKeys(keys)
}

export function isFavoriteSource(key: string): boolean {
  return getFavoriteSourceKeys().includes(key)
}

export async function getFavoriteSources(): Promise<LocalVodSource[]> {
  const allSources = await loadAllSources()
  const favoriteKeys = getFavoriteSourceKeys()
  return allSources.filter(s => favoriteKeys.includes(s.key))
}

// Merge and deduplicate search results from multiple sources
export function mergeAndRankResults(
  results: { sourceKey: string; items: { name: string; vodId: string; [key: string]: unknown }[] }[],
  keyword: string
): { name: string; sourceKey: string; vodId: string; score: number; [key: string]: unknown }[] {
  const keywordLower = keyword.toLowerCase()

  // Group by similar name
  const nameGroups = new Map<string, { name: string; sourceKey: string; vodId: string; score: number; [key: string]: unknown }[]>()

  for (const result of results) {
    for (const item of result.items) {
      const name = (item.name || '').toLowerCase().trim()
      if (!name) continue

      // Calculate relevance score
      let score = 0
      if (name === keywordLower) {
        score = 100 // Exact match
      } else if (name.startsWith(keywordLower)) {
        score = 80 // Starts with
      } else if (name.includes(keywordLower)) {
        score = 60 // Contains
      } else {
        // Check each keyword word
        const words = keywordLower.split(/\s+/)
        const matchedWords = words.filter(w => name.includes(w))
        score = (matchedWords.length / words.length) * 50
      }

      // Only include if score > 0 (relevant)
      if (score <= 0) continue

      // Find or create group
      const normalizedName = normalizeForGrouping(name)
      if (!nameGroups.has(normalizedName)) {
        nameGroups.set(normalizedName, [])
      }
      nameGroups.get(normalizedName)!.push({
        ...item,
        name: item.name,
        sourceKey: result.sourceKey,
        vodId: item.vodId,
        score
      })
    }
  }

  // Convert to array and sort
  const merged: { name: string; sourceKey: string; vodId: string; score: number; [key: string]: unknown }[] = []

  for (const [, group] of nameGroups) {
    // Sort group by score (highest first)
    group.sort((a, b) => b.score - a.score)
    // Use highest score for the group
    const bestScore = group[0].score
    // Count of sources with this item
    const sourceCount = new Set(group.map(g => g.sourceKey)).size

    // Add all items from group
    for (const item of group) {
      merged.push({
        ...item,
        // Boost score if multiple sources have it
        score: item.score + (sourceCount > 1 ? 20 : 0)
      })
    }
  }

  // Sort by score (highest first)
  merged.sort((a, b) => b.score - a.score)

  return merged
}

// Normalize name for grouping similar titles
function normalizeForGrouping(name: string): string {
  return name
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[第季集期]/g, '') // Remove episode markers
    .replace(/\d+$/g, '') // Remove trailing numbers
    .replace(/[^a-zA-Z0-9一-鿿]/g, '') // Keep only alphanumeric and Chinese
    .toLowerCase()
}
