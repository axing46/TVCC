/**
 * Route ALL source images through /api/proxy to:
 * 1. Fix Mixed Content (HTTP images on HTTPS page)
 * 2. Bypass hotlink protection (Referer checks)
 * 3. Handle CORS issues
 */

const IS_HTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:'

export function proxyImageUrl(url: string | undefined | null): string {
  if (!url) return ''

  // Skip already-proxied URLs
  if (url.startsWith('/api/proxy')) return url

  // Skip data URIs
  if (url.startsWith('data:')) return url

  // Always proxy external images through our backend
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `/api/proxy?url=${encodeURIComponent(url)}`
  }

  return url
}
