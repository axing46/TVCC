/**
 * Network client — all source API requests go through /api/proxy
 * to avoid CORS and Mixed Content issues on HTTPS deployments.
 */

/** Route any URL through our proxy */
function proxyUrl(url: string): string {
  return `/api/proxy?url=${encodeURIComponent(url)}`
}

/**
 * Fetch source API data through the proxy.
 * Handles both direct URLs and proxied URLs automatically.
 */
export async function fetchSourceApi(url: string): Promise<unknown> {
  const proxied = proxyUrl(url)
  const res = await fetch(proxied)
  if (!res.ok) {
    throw new Error(`Proxy error ${res.status}: ${res.statusText}`)
  }
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Fetch Douban/Bangumi API through the proxy.
 */
export async function fetchDoubanApi(url: string, params?: Record<string, string>): Promise<unknown> {
  const targetUrl = params
    ? `${url}?${new URLSearchParams(params).toString()}`
    : url
  const proxied = proxyUrl(targetUrl)
  const res = await fetch(proxied, {
    headers: {
      'Referer': 'https://movie.douban.com/',
    },
  })
  if (!res.ok) {
    throw new Error(`Douban API error ${res.status}`)
  }
  return res.json()
}
