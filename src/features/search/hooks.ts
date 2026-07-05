import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { searchAllSources, SearchCache, type SearchAllResult } from './api'
import { useDebounce } from '@/hooks/useDebounce'

const searchCache = new SearchCache()
const SESSION_KEY_PREFIX = 'sv_search_'

/** Read cached results from sessionStorage */
function getSessionCache(query: string): SearchAllResult | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY_PREFIX + query)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Write results to sessionStorage */
function setSessionCache(query: string, result: SearchAllResult) {
  try {
    sessionStorage.setItem(SESSION_KEY_PREFIX + query, JSON.stringify(result))
  } catch { /* quota exceeded */ }
}

export function useSearch(keyword: string) {
  const debounced = useDebounce(keyword, 200) // Faster: 200ms
  const queryClient = useQueryClient()
  const [streamingItems, setStreamingItems] = useState<SearchAllResult | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Streaming search
  useEffect(() => {
    if (!debounced.trim()) {
      setStreamingItems(null)
      return
    }

    let cancelled = false
    setIsStreaming(true)
    setStreamingItems(null)

    const streamSearch = async () => {
      await searchAllSources(
        debounced,
        searchCache,
        (batch) => {
          if (cancelled) return
          setStreamingItems(prev => ({
            items: [...(prev?.items ?? []), ...batch],
            sourceCount: prev?.sourceCount ?? 0,
            errorCount: prev?.errorCount ?? 0,
          }))
        },
        true, // fastOnly mode for initial results
      )
      if (!cancelled) setIsStreaming(false)
    }

    streamSearch()
    return () => { cancelled = true }
  }, [debounced])

  // Full search in background
  const query = useQuery({
    queryKey: ['search', debounced],
    queryFn: async () => {
      const result = await searchAllSources(debounced, searchCache)
      setSessionCache(debounced, result)
      return result
    },
    enabled: debounced.trim().length > 0,
    staleTime: 2 * 60 * 1000,
    placeholderData: () => {
      if (!debounced.trim()) return undefined
      const cached = getSessionCache(debounced)
      if (cached) return cached
      return queryClient.getQueryData<SearchAllResult>(['search', debounced])
    },
  })

  // Return streaming results first, then full results
  const data = query.data ?? streamingItems

  return {
    ...query,
    data,
    isStreaming,
  }
}
