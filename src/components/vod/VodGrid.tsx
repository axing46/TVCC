import type { VodItem } from '@/core/models'
import { VodCard, VodCardSkeleton } from './VodCard'

interface VodGridProps {
  items: VodItem[]
  loading?: boolean
  /** Override columns for specific layouts */
  columns?: { sm?: number; md?: number; lg?: number; xl?: number }
}

export function VodGrid({ items, loading, columns }: VodGridProps) {
  const cols = {
    sm: columns?.sm ?? 3,
    md: columns?.md ?? 4,
    lg: columns?.lg ?? 5,
    xl: columns?.xl ?? 6,
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-${cols.sm} md:grid-cols-${cols.md} lg:grid-cols-${cols.lg} xl:grid-cols-${cols.xl} gap-3 sm:gap-4`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <VodCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-${cols.sm} md:grid-cols-${cols.md} lg:grid-cols-${cols.lg} xl:grid-cols-${cols.xl} gap-2 sm:gap-3`}>
      {items.map((item) => (
        <div key={`${item.sourceKey}-${item.vodId}`} className="animate-fade-up opacity-0 [animation-fill-mode:forwards]">
          <VodCard item={item} />
        </div>
      ))}
    </div>
  )
}
