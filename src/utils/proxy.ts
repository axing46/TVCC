/**
 * Image URL handling:
 * - HTTP images on HTTPS page → route through /api/proxy (Mixed Content fix)
 * - HTTPS images → use directly, rely on referrerPolicy="no-referrer" to bypass hotlink
 */

const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:'

export function proxyImageUrl(url: string | undefined | null): string {
  if (!url) return ''
  if (url.startsWith('/api/proxy')) return url
  if (url.startsWith('data:')) return url

  // HTTP on HTTPS page → must proxy (browser blocks Mixed Content)
  if (IS_HTTPS && url.startsWith('http://')) {
    return `/api/proxy?url=${encodeURIComponent(url)}`
  }

  // HTTPS images → use directly (img tag will use referrerPolicy="no-referrer")
  return url
}
