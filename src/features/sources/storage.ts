import type { LocalVodSource } from '@/core/models'
import { localVodSourceFromStorage, localVodSourceToJson } from '@/core/models'
export type { LocalVodSource } from '@/core/models'

const STORAGE_KEY = 'sv_sources_v1'
const SOURCES_VERSION_KEY = 'sv_sources_version'
const CURRENT_SOURCES_VERSION = 6 // 恢复47个片源

// CORS proxies to try (in order) when fetching from browser
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  (url: string) => `https://yacdn.org/proxy/${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
]

// 47个默认片源配置
const DEFAULT_SOURCES: LocalVodSource[] = [
  { key: 'ikunzy', name: 'ikun资源', apiUrl: 'https://ikunzyapi.com/api.php/provide/vod', detailUrl: 'https://ikunzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'iqiyizy', name: '爱奇艺资源', apiUrl: 'https://iqiyizyapi.com/api.php/provide/vod', detailUrl: 'https://iqiyizyapi.com/api.php/provide/vod', enabled: true },
  { key: 'ffzy', name: '非凡资源', apiUrl: 'https://cj.ffzyapi.com/api.php/provide/vod', detailUrl: 'https://cj.ffzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'hongniu', name: '红牛资源', apiUrl: 'https://www.hongniuzy2.com/api.php/provide/vod', detailUrl: 'https://www.hongniuzy2.com/api.php/provide/vod', enabled: true },
  { key: 'lzcaiji', name: '量子采集', apiUrl: 'https://cj.lzcaiji.com/api.php/provide/vod', detailUrl: 'https://cj.lzcaiji.com/api.php/provide/vod', enabled: true },
  { key: 'sdzy', name: '闪电资源', apiUrl: 'https://sdzyapi.com/api.php/provide/vod', detailUrl: 'https://sdzyapi.com/api.php/provide/vod', enabled: true },
  { key: '360zy', name: '360资源', apiUrl: 'https://360zy.com/api.php/provide/vod', detailUrl: 'https://360zy.com/api.php/provide/vod', enabled: true },
  { key: 'wujin', name: '无尽资源', apiUrl: 'https://api.wujinapi.me/api.php/provide/vod', detailUrl: 'https://api.wujinapi.me/api.php/provide/vod', enabled: true },
  { key: 'maoyan', name: '猫眼资源', apiUrl: 'https://api.maoyanapi.top/api.php/provide/vod', detailUrl: 'https://api.maoyanapi.top/api.php/provide/vod', enabled: true },
  { key: 'heimuer', name: '黑木耳资源', apiUrl: 'https://json.heimuer.xyz/api.php/provide/vod', detailUrl: 'https://json.heimuer.xyz/api.php/provide/vod', enabled: true },
  { key: 'hwzy', name: '红牛VIP', apiUrl: 'https://www.hongniuzy2.com/api.php/provide/vod', detailUrl: 'https://www.hongniuzy2.com/api.php/provide/vod', enabled: true },
  { key: 'dbzy', name: '豆瓣资源', apiUrl: 'https://dbzyapi.com/api.php/provide/vod', detailUrl: 'https://dbzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'bfzy', name: '暴风资源', apiUrl: 'https://bfzyapi.com/api.php/provide/vod', detailUrl: 'https://bfzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'tpzy', name: '淘片资源', apiUrl: 'https://taopianapi.com/home/cjapi/vod/mc/we/page', detailUrl: 'https://taopianapi.com/home/cjapi/vod/mc/we/page', enabled: true },
  { key: 'gszy', name: '光速资源', apiUrl: 'https://api.guangsuapi.com/api.php/provide/vod', detailUrl: 'https://api.guangsuapi.com/api.php/provide/vod', enabled: true },
  { key: 'tkzy', name: '天空资源', apiUrl: 'https://api.tiankongapi.com/api.php/provide/vod', detailUrl: 'https://api.tiankongapi.com/api.php/provide/vod', enabled: true },
  { key: 'jszy', name: '极速资源', apiUrl: 'https://jszyapi.com/api.php/provide/vod', detailUrl: 'https://jszyapi.com/api.php/provide/vod', enabled: true },
  { key: 'lydzy', name: '量子资源', apiUrl: 'https://cj.lziapi.com/api.php/provide/vod', detailUrl: 'https://cj.lziapi.com/api.php/provide/vod', enabled: true },
  { key: 'wzzy', name: '无尽ME', apiUrl: 'https://www.wujinapi.me/api.php/provide/vod', detailUrl: 'https://www.wujinapi.me/api.php/provide/vod', enabled: true },
  { key: 'bfzy2', name: '暴风极速', apiUrl: 'https://bfzyapi.com/api.php/provide/vod', detailUrl: 'https://bfzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'moduzy', name: '魔都资源', apiUrl: 'https://moduzyapi.com/api.php/provide/vod', detailUrl: 'https://moduzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'kkzy', name: '快快资源', apiUrl: 'https://api.kkzyapi.com/api.php/provide/vod', detailUrl: 'https://api.kkzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'hnzy', name: '红牛极速', apiUrl: 'https://hnzyapi.com/api.php/provide/vod', detailUrl: 'https://hnzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'wzwzy', name: '万能资源', apiUrl: 'https://www.wnzyapi.com/api.php/provide/vod', detailUrl: 'https://www.wnzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'ckzy', name: '超人资源', apiUrl: 'https://ckzy.me/api.php/provide/vod', detailUrl: 'https://ckzy.me/api.php/provide/vod', enabled: true },
  { key: 'feifan', name: '非凡资源', apiUrl: 'http://ffzy5.tv/api.php/provide/vod', detailUrl: 'http://ffzy5.tv/api.php/provide/vod', enabled: true },
  { key: 'wolong', name: '卧龙资源', apiUrl: 'https://wolongzyw.com/api.php/provide/vod', detailUrl: 'https://wolongzyw.com/api.php/provide/vod', enabled: true },
  { key: 'zuida', name: '最大资源', apiUrl: 'https://api.zuidapi.com/api.php/provide/vod', detailUrl: 'https://api.zuidapi.com/api.php/provide/vod', enabled: true },
  { key: 'baiduyun', name: '百度云资源', apiUrl: 'https://api.apibdzy.com/api.php/provide/vod', detailUrl: 'https://api.apibdzy.com/api.php/provide/vod', enabled: true },
  { key: 'tianya', name: '天涯资源', apiUrl: 'https://tyyszy.com/api.php/provide/vod', detailUrl: 'https://tyyszy.com/api.php/provide/vod', enabled: true },
  { key: 'modu', name: '魔都资源', apiUrl: 'https://www.mdzyapi.com/api.php/provide/vod', detailUrl: 'https://www.mdzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'sanliuling', name: '360资源', apiUrl: 'https://360zy.com/api.php/provide/vod', detailUrl: 'https://360zy.com/api.php/provide/vod', enabled: true },
  { key: 'dytt', name: '电影天堂', apiUrl: 'http://caiji.dyttzyapi.com/api.php/provide/vod', detailUrl: 'http://caiji.dyttzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'ruyi', name: '如意资源', apiUrl: 'https://cj.rycjapi.com/api.php/provide/vod', detailUrl: 'https://cj.rycjapi.com/api.php/provide/vod', enabled: true },
  { key: 'wangwang', name: '旺旺资源', apiUrl: 'https://wwzy.tv/api.php/provide/vod', detailUrl: 'https://wwzy.tv/api.php/provide/vod', enabled: true },
  { key: 'guangsu', name: '光速资源', apiUrl: 'https://api.guangsuapi.com/api.php/provide/vod', detailUrl: 'https://api.guangsuapi.com/api.php/provide/vod', enabled: true },
  { key: 'ikun', name: 'iKun资源', apiUrl: 'https://ikunzyapi.com/api.php/provide/vod', detailUrl: 'https://ikunzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'youku', name: '优酷资源', apiUrl: 'https://api.ukuapi.com/api.php/provide/vod', detailUrl: 'https://api.ukuapi.com/api.php/provide/vod', enabled: true },
  { key: 'huya', name: '虎牙资源', apiUrl: 'https://www.huyaapi.com/api.php/provide/vod', detailUrl: 'https://www.huyaapi.com/api.php/provide/vod', enabled: true },
  { key: 'xinlang', name: '新浪资源', apiUrl: 'http://api.xinlangapi.com/xinlangapi.php/provide/vod', detailUrl: 'http://api.xinlangapi.com/xinlangapi.php/provide/vod', enabled: true },
  { key: 'lezi', name: '乐子资源', apiUrl: 'https://cj.lziapi.com/api.php/provide/vod', detailUrl: 'https://cj.lziapi.com/api.php/provide/vod', enabled: true },
  { key: 'haihua', name: '海豚资源', apiUrl: 'https://hhzyapi.com/api.php/provide/vod', detailUrl: 'https://hhzyapi.com/api.php/provide/vod', enabled: true },
  { key: 'jiangyu', name: '鲸鱼资源', apiUrl: 'https://jyzyapi.com/provide/vod', detailUrl: 'https://jyzyapi.com/provide/vod', enabled: true },
  { key: 'yilingba', name: '1080资源', apiUrl: 'https://api.1080zyku.com/inc/api_mac10.php', detailUrl: 'https://api.1080zyku.com/inc/api_mac10.php', enabled: true },
  { key: 'aidan', name: '爱蛋资源', apiUrl: 'https://lovedan.net/api.php/provide/vod', detailUrl: 'https://lovedan.net/api.php/provide/vod', enabled: true },
  { key: 'leba', name: '乐播资源', apiUrl: 'https://lbapi9.com/api.php/provide/vod', detailUrl: 'https://lbapi9.com/api.php/provide/vod', enabled: true },
  { key: 'moduzy2', name: '魔都影视', apiUrl: 'https://www.moduzy.com/api.php/provide/vod', detailUrl: 'https://www.moduzy.com/api.php/provide/vod', enabled: true },
  { key: 'feifanapi', name: '非凡API', apiUrl: 'https://api.ffzyapi.com/api.php/provide/vod', detailUrl: 'https://api.ffzyapi.com/api.php/provide/vod', enabled: true },
]

export async function loadAllSources(): Promise<LocalVodSource[]> {
  try {
    // Check if sources version needs update
    const savedVersion = localStorage.getItem(SOURCES_VERSION_KEY)
    if (savedVersion !== String(CURRENT_SOURCES_VERSION)) {
      // Version mismatch — update sources while preserving user's enabled/disabled state
      const raw = localStorage.getItem(STORAGE_KEY)
      let existingSources: LocalVodSource[] = []

      if (raw) {
        try {
          existingSources = (JSON.parse(raw) as unknown[]).map(localVodSourceFromStorage)
        } catch {
          existingSources = []
        }
      }

      // Create a map of existing sources' enabled state
      const existingState = new Map(existingSources.map(s => [s.key, s.enabled]))

      // Merge: use default sources, preserve user's enabled/disabled choices
      const mergedSources = DEFAULT_SOURCES.map(s => ({
        ...s,
        enabled: existingState.has(s.key) ? existingState.get(s.key)! : s.enabled,
      }))

      // Add any user-added sources not in defaults
      for (const existing of existingSources) {
        if (!mergedSources.some(s => s.key === existing.key)) {
          mergedSources.push(existing)
        }
      }

      saveSources(mergedSources)
      localStorage.setItem(SOURCES_VERSION_KEY, String(CURRENT_SOURCES_VERSION))
      return mergedSources
    }

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // First visit — save defaults
      saveSources(DEFAULT_SOURCES)
      return DEFAULT_SOURCES
    }
    const list = JSON.parse(raw) as unknown[]
    return list.map(localVodSourceFromStorage)
  } catch {
    return DEFAULT_SOURCES
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

export async function clearAllSources(): Promise<void> {
  saveSources([])
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

  // Helper to extract source from various formats
  function extractSource(item: Record<string, unknown>): { key: string; name: string; api: string; detail?: string; group?: string; r18?: boolean } {
    return {
      key: String(item['key'] ?? item['id'] ?? item['sourceKey'] ?? ''),
      name: String(item['name'] ?? item['sourceName'] ?? item['title'] ?? ''),
      api: String(item['api'] ?? item['apiUrl'] ?? item['baseUrl'] ?? item['url'] ?? ''),
      detail: String(item['detail'] ?? item['detailUrl'] ?? item['api'] ?? item['apiUrl'] ?? item['baseUrl'] ?? ''),
      group: (item['group'] ?? item['category']) as string | undefined,
      r18: item['r18'] as boolean | undefined,
    }
  }

  // Try to find sources array in various structures
  function findSourcesArray(obj: unknown): Record<string, unknown>[] | null {
    if (Array.isArray(obj)) return obj as Record<string, unknown>[]

    if (typeof obj === 'object' && obj !== null) {
      const record = obj as Record<string, unknown>

      // Check common keys
      for (const key of ['sources', 'sites', 'list', 'data', 'items']) {
        if (Array.isArray(record[key])) return record[key] as Record<string, unknown>[]
      }

      // Check nested: settings.sources, config.sites, etc.
      for (const key of ['settings', 'config', 'result']) {
        if (typeof record[key] === 'object' && record[key] !== null) {
          const nested = record[key] as Record<string, unknown>
          for (const nkey of ['sources', 'sites', 'list', 'data', 'items']) {
            if (Array.isArray(nested[nkey])) return nested[nkey] as Record<string, unknown>[]
          }
        }
      }

      // Check api_site format (object with key->source mapping)
      if (record['api_site'] && typeof record['api_site'] === 'object') {
        const apiSite = record['api_site'] as Record<string, Record<string, unknown>>
        return Object.entries(apiSite).map(([key, value]) => ({ ...value, key, id: key }))
      }
    }

    return null
  }

  const sourcesArray = findSourcesArray(data)
  if (sourcesArray) {
    remoteList = sourcesArray.map(extractSource).filter(s => s.key && s.api)
  }

  const sources = await loadAllSources()
  const existingKeys = new Set(sources.map((s) => s.key))
  // Also track existing API URLs for dedup
  const existingUrls = new Set(sources.map((s) => normalizeUrl(s.apiUrl)))
  const added: string[] = []
  const skipped: string[] = []
  const errors: string[] = []

  for (const remote of remoteList) {
    if (!remote.key || !remote.api) {
      errors.push(`${remote.name || '(unknown)'}: 缺少必要字段`)
      continue
    }
    // Dedup by key
    if (existingKeys.has(remote.key)) {
      skipped.push(remote.key)
      continue
    }
    // Dedup by API URL
    const normalizedApi = normalizeUrl(remote.api)
    if (existingUrls.has(normalizedApi)) {
      skipped.push(remote.key)
      continue
    }
    existingKeys.add(remote.key)
    existingUrls.add(normalizedApi)
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

// Normalize URL for dedup (remove protocol, trailing slash, etc.)
function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .toLowerCase()
}
