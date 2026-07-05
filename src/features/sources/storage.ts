import type { LocalVodSource } from '@/core/models'
import { localVodSourceFromStorage, localVodSourceToJson } from '@/core/models'
export type { LocalVodSource } from '@/core/models'

const STORAGE_KEY = 'sv_sources_v1'

// Remote sources config URL
const REMOTE_SOURCES_URL = 'https://raw.githubusercontent.com/WEP-56/TTTTV-config/main/sources.json'

// CORS proxies to try (in order) when fetching from browser
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

// Fetch remote sources config
async function fetchRemoteSources(): Promise<LocalVodSource[]> {
  try {
    // Try direct fetch first
    let text: string
    try {
      const res = await fetch(REMOTE_SOURCES_URL)
      if (res.ok) {
        text = await res.text()
      } else {
        throw new Error('Direct fetch failed')
      }
    } catch {
      // Try CORS proxies
      for (const proxy of CORS_PROXIES) {
        try {
          const res = await fetch(proxy(REMOTE_SOURCES_URL))
          if (res.ok) {
            text = await res.text()
            break
          }
        } catch {
          continue
        }
      }
      throw new Error('All fetch attempts failed')
    }

    const data = JSON.parse(text!)

    // Parse different formats
    let remoteList: { key: string; name: string; api: string; detail?: string }[] = []

    if (Array.isArray(data)) {
      remoteList = data.map((item: Record<string, unknown>) => ({
        key: String(item['key'] ?? item['name'] ?? ''),
        name: String(item['name'] ?? item['key'] ?? ''),
        api: String(item['api'] ?? item['apiUrl'] ?? ''),
        detail: String(item['detail'] ?? item['detailUrl'] ?? item['api'] ?? item['apiUrl'] ?? ''),
      }))
    } else if (data['sources'] && Array.isArray(data['sources'])) {
      remoteList = (data['sources'] as Record<string, unknown>[]).map((item) => ({
        key: String(item['key'] ?? item['name'] ?? ''),
        name: String(item['name'] ?? item['key'] ?? ''),
        api: String(item['api'] ?? item['apiUrl'] ?? ''),
        detail: String(item['detail'] ?? item['detailUrl'] ?? item['api'] ?? item['apiUrl'] ?? ''),
      }))
    } else if (data['api_site']) {
      const apiSite = data['api_site'] as Record<string, Record<string, unknown>>
      remoteList = Object.entries(apiSite).map(([key, value]) => ({
        key,
        name: String(value['name'] ?? key),
        api: String(value['api'] ?? ''),
        detail: String(value['detail'] ?? value['api'] ?? ''),
      }))
    }

    return remoteList
      .filter(s => s.key && s.api)
      .map(s => ({
        key: s.key,
        name: s.name,
        apiUrl: s.api,
        detailUrl: s.detail || s.api,
        enabled: true,
      }))
  } catch {
    console.warn('Failed to fetch remote sources, using empty defaults')
    return []
  }
}

export async function loadAllSources(): Promise<LocalVodSource[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // First visit — fetch remote sources and save
      const remoteSources = await fetchRemoteSources()
      if (remoteSources.length > 0) {
        saveSources(remoteSources)
        return remoteSources
      }
      // Fallback to empty if remote fetch fails
      return []
    }
    const list = JSON.parse(raw) as unknown[]
    return list.map(localVodSourceFromStorage)
  } catch {
    return []
  }
}

function saveSources(sources: LocalVodSource[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sources.map(localVodSourceToJson)))
}

export async function getSource(key: string): Promise<LocalVodSource | undefined> {
  const sources = await loadAllSources()
  return sources.find((s) => s.key === key)
}

export async function toggleSource(key: string, enabled: boolean): Promise<void> {
  const sources = await loadAllSources()
  const updated = sources.map((s) => (s.key === key ? { ...s, enabled } : s))
  saveSources(updated)
}

export async function addSource(source: LocalVodSource): Promise<void> {
  const sources = await loadAllSources()
  if (sources.some((s) => s.key === source.key)) {
    throw new Error(`片源已存在: ${source.key}`)
  }
  sources.push(source)
  saveSources(sources)
}

export async function deleteSource(key: string): Promise<void> {
  const sources = await loadAllSources()
  const filtered = sources.filter((s) => s.key !== key)
  if (filtered.length === sources.length) throw new Error(`片源不存在: ${key}`)
  saveSources(filtered)
}

async function fetchWithProxy(url: string): Promise<string> {
  // Try direct access first
  try {
    const res = await fetch(url)
    if (res.ok) return await res.text()
  } catch {
    // Direct failed, try proxies
  }

  // Try each CORS proxy
  const errors: string[] = []
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy(url)
      const res = await fetch(proxyUrl)
      if (res.ok) return await res.text()
      errors.push(`proxy returned ${res.status}`)
    } catch (e) {
      errors.push(`proxy failed: ${(e as Error).message}`)
    }
  }

  throw new Error(
    `无法获取片源数据。直接请求和 CORS 代理均失败。\n` +
    `请尝试：\n1. 检查网络连接\n2. 将 JSON 内容粘贴到下方文本框导入`,
  )
}

export async function importRemoteSources(
  url: string,
): Promise<{ added: string[]; skipped: string[]; errors: string[] }> {
  const raw = await fetchWithProxy(url)
  return importSourcesFromJson(raw)
}

/** Import from JSON string (paste) — bypasses network issues */
export async function importSourcesFromJson(
  raw: string,
): Promise<{ added: string[]; skipped: string[]; errors: string[] }> {
  const data = JSON.parse(raw)

  let remoteList: { key: string; name: string; api: string; detail?: string; group?: string; r18?: boolean }[] = []

  if (Array.isArray(data)) {
    remoteList = data.map((item: Record<string, unknown>) => ({
      key: String(item['key'] ?? ''),
      name: String(item['name'] ?? ''),
      api: String(item['api'] ?? ''),
      detail: String(item['detail'] ?? item['api'] ?? ''),
      group: item['group'] as string | undefined,
      r18: item['r18'] as boolean | undefined,
    }))
  } else if (data['sources'] && Array.isArray(data['sources'])) {
    remoteList = (data['sources'] as Record<string, unknown>[]).map((item) => ({
      key: String(item['key'] ?? ''),
      name: String(item['name'] ?? ''),
      api: String(item['api'] ?? ''),
      detail: String(item['detail'] ?? item['api'] ?? ''),
      group: item['group'] as string | undefined,
      r18: item['r18'] as boolean | undefined,
    }))
  } else if (data['api_site']) {
    const apiSite = data['api_site'] as Record<string, Record<string, unknown>>
    remoteList = Object.entries(apiSite).map(([key, value]) => ({
      key,
      name: String(value['name'] ?? key),
      api: String(value['api'] ?? ''),
      detail: String(value['detail'] ?? value['api'] ?? ''),
      group: value['group'] as string | undefined,
      r18: value['r18'] as boolean | undefined,
    }))
  }

  const sources = await loadAllSources()
  const existingKeys = new Set(sources.map((s) => s.key))
  const added: string[] = []
  const skipped: string[] = []
  const errors: string[] = []

  for (const remote of remoteList) {
    if (!remote.key || !remote.api) {
      errors.push(`${remote.name || '(unknown)'}: 缺少必要字段`)
      continue
    }
    if (existingKeys.has(remote.key)) {
      skipped.push(remote.key)
      continue
    }
    existingKeys.add(remote.key)
    sources.push({
      key: remote.key,
      name: remote.name,
      apiUrl: remote.api,
      detailUrl: remote.detail || remote.api,
      enabled: true,
      r18: remote.r18,
      group: remote.group,
    })
    added.push(remote.key)
  }

  saveSources(sources)
  return { added, skipped, errors }
}
