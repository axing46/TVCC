/**
 * Route ALL external images through /api/proxy to:
 * - Fix Mixed Content (HTTP on HTTPS)
 * - Bypass hotlink protection (Referer checks)
 */

export function proxyImageUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (url.startsWith('/api/proxy')) return url
  if (url.startsWith('data:')) return url
  if (url.startsWith('/')) return url // relative paths

  // All external URLs → proxy
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/proxy?url=${encodeURIComponent(url)}`
  }

  return url
}
