/**
 * Vercel Serverless Function — M3U8 Anti-leech Proxy
 *
 * Same logic as vite-plugin-proxy.ts but runs on Vercel Edge/Serverless.
 * Handles /api/proxy?url=<encoded_url>
 */

import http from 'node:http'
import https from 'node:https'

// M3U8 detection
function isM3u8Content(url, contentType) {
  if (contentType.includes('mpegurl') || contentType.includes('vnd.apple.mpegurl')) return true
  if (contentType.includes('json') || contentType.includes('html') || contentType.includes('image') || contentType.includes('video/')) return false
  if (url.toLowerCase().includes('.m3u8')) return true
  return false
}

// M3U8 rewriter — resolve relative URLs against base
function rewriteM3u8(text, baseUrl) {
  const lines = text.split('\n')
  const out = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length > 0 && !trimmed.startsWith('#')) {
      const absoluteUrl = new URL(trimmed, baseUrl).toString()
      out.push(`/api/proxy?url=${encodeURIComponent(absoluteUrl)}`)
    } else {
      out.push(line)
    }
  }
  return out.join('\n')
}

// Fetch with anti-leech headers
function fetchWithHeaders(targetUrl) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl)
    const transport = parsed.protocol === 'https:' ? https : http

    const req = transport.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': `${parsed.protocol}//${parsed.host}/`,
        'Origin': `${parsed.protocol}//${parsed.host}`,
      },
      timeout: 15000,
      rejectUnauthorized: false,
    }, (res) => {
      // Follow redirects (max 3)
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = new URL(res.headers.location, targetUrl).toString()
        return fetchWithHeaders(next).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve({
        body: Buffer.concat(chunks),
        contentType: res.headers['content-type'] ?? '',
        statusCode: res.statusCode ?? 200,
      }))
      res.on('error', reject)
    })
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.on('error', reject)
    req.end()
  })
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  const reqUrl = new URL(req.url, `https://${req.headers.host}`)
  const targetUrl = reqUrl.searchParams.get('url')

  if (!targetUrl) {
    return res.status(400).send('Missing ?url=')
  }

  try {
    const fetched = await fetchWithHeaders(targetUrl)

    if (fetched.statusCode >= 400) {
      return res.status(502).send(`Upstream ${fetched.statusCode}`)
    }

    const isM3u8 = isM3u8Content(targetUrl, fetched.contentType)

    if (isM3u8) {
      const text = fetched.body.toString('utf-8')
      const rewritten = rewriteM3u8(text, targetUrl)
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
      res.setHeader('Cache-Control', 'public, max-age=60')
      return res.send(rewritten)
    }

    res.setHeader('Content-Type', fetched.contentType || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    return res.send(fetched.body)
  } catch (err) {
    console.error(`[proxy] ${targetUrl}: ${err.message}`)
    return res.status(502).send(`Proxy error: ${err.message}`)
  }
}
