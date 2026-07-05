import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, ChevronDown, ChevronUp, Search, X, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { loadMovieData, getGenres, getMoviesByGenre, type MovieItem } from './movieData'
import { Loading, ErrorState } from '@/components/ui/Status'

const POPUP_SHOWN_KEY = 'tvcc_popup_shown_session'

// 更新内容数据
const UPDATE_ITEMS = [
  { id: 1, title: '默认片源', desc: '初始导入27个片源，删除搜索片源分类，提升视觉体验' },
  { id: 2, title: '音量调节', desc: '仿造YouTube横向音量控制，更便捷的音量调节' },
  { id: 3, title: '进度条', desc: '可拖动进度条，避免松手弹回，拖动时显示时间反馈' },
  { id: 4, title: '手机适配', desc: '全面优化移动端UI，提供更好的手机浏览体验' },
  { id: 5, title: '联系我们', desc: '新增首页弹窗，展示联系方式及交流群信息' },
]

function Banner() {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (isHovered) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % UPDATE_ITEMS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isHovered])

  return (
    <div
      className="relative mb-6 rounded-2xl overflow-hidden bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-white/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="px-5 py-4 sm:px-8 sm:py-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">更新</span>
          <span className="text-[11px] text-muted">v{UPDATE_ITEMS[current].id}.0</span>
        </div>
        <h3 className="text-[15px] sm:text-[17px] font-bold text-ink mb-1">{UPDATE_ITEMS[current].title}</h3>
        <p className="text-[12px] sm:text-[13px] text-muted leading-relaxed">{UPDATE_ITEMS[current].desc}</p>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + UPDATE_ITEMS.length) % UPDATE_ITEMS.length)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm
          flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % UPDATE_ITEMS.length)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm
          flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 sm:opacity-100"
      >
        <ChevronRight size={16} />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {UPDATE_ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'bg-accent w-4' : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function WelcomePopup() {
  const [show, setShow] = useState(false)
  const [copiedWechat, setCopiedWechat] = useState(false)
  const [copiedQQ, setCopiedQQ] = useState(false)

  useEffect(() => {
    // Use sessionStorage - clears when browser/tab closes, shows again on reopen
    const shown = sessionStorage.getItem(POPUP_SHOWN_KEY)
    if (!shown) {
      setShow(true)
    }
  }, [])

  const handleDismiss = () => {
    setShow(false)
    sessionStorage.setItem(POPUP_SHOWN_KEY, '1')
  }

  const copyToClipboard = useCallback(async (text: string, type: 'wechat' | 'qq') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'wechat') {
        setCopiedWechat(true)
        setTimeout(() => setCopiedWechat(false), 1500)
      } else {
        setCopiedQQ(true)
        setTimeout(() => setCopiedQQ(false), 1500)
      }
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      if (type === 'wechat') {
        setCopiedWechat(true)
        setTimeout(() => setCopiedWechat(false), 1500)
      } else {
        setCopiedQQ(true)
        setTimeout(() => setCopiedQQ(false), 1500)
      }
    }
  }, [])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card max-w-[380px] w-full p-6 relative animate-fade-up">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 text-muted hover:text-ink transition-all"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-5">
          <h3 className="text-[18px] font-bold text-ink mb-2">感谢使用 TVCC</h3>
          <p className="text-[13px] text-muted leading-relaxed">
            使用中有任何问题或优化意见均可联系
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-btn bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[12px] text-muted w-8">微信</span>
            <span className="text-[13px] text-ink font-medium flex-1">18726591481</span>
            <button
              onClick={() => copyToClipboard('18726591481', 'wechat')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-accent transition-all"
              title="复制"
            >
              {copiedWechat ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-btn bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[12px] text-muted w-8">QQ</span>
            <span className="text-[13px] text-ink font-medium flex-1">1480545128</span>
            <button
              onClick={() => copyToClipboard('1480545128', 'qq')}
              className="p-1.5 rounded-lg hover:bg-white/10 text-muted hover:text-accent transition-all"
              title="复制"
            >
              {copiedQQ ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full mt-5 py-2.5 rounded-btn bg-accent/15 border border-accent/30 text-accent text-[13px] font-medium
            hover:bg-accent/25 transition-all duration-200"
        >
          我知道了
        </button>
      </div>
    </div>
  )
}

const INITIAL_SHOW = 12

function MovieCard({ movie, onClick }: { movie: MovieItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="glass-card p-3 text-left w-full cursor-pointer hover:-translate-y-0.5 transition-transform duration-200 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-ink truncate group-hover:text-accent transition-colors">
            {movie.title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="pill text-[10px]">{movie.type}</span>
            {movie.region && (
              <span className="text-[11px] text-muted">{movie.region}</span>
            )}
          </div>
          {movie.cast.length > 0 && (
            <p className="text-[11px] text-muted/70 mt-1.5 truncate">
              {movie.cast.join(' / ')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 text-champagne flex-shrink-0">
          <Star size={13} fill="#f4d28a" strokeWidth={0} />
          <span className="text-[13px] font-bold">{movie.rating}</span>
        </div>
      </div>
    </button>
  )
}

function GenreSection({
  genre,
  movies,
}: {
  genre: string
  movies: MovieItem[]
}) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const hasMore = movies.length > INITIAL_SHOW
  const visible = expanded ? movies : movies.slice(0, INITIAL_SHOW)

  const handleClick = (title: string) => {
    navigate(`/search?q=${encodeURIComponent(title)}`)
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-bold text-ink">{genre}</h2>
        <span className="text-[11px] text-muted">{movies.length} 部</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {visible.map((m, i) => (
          <MovieCard key={`${m.title}-${i}`} movie={m} onClick={() => handleClick(m.title)} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 mx-auto mt-4 px-5 py-2 rounded-btn border border-white/10
            text-[12px] text-muted hover:text-ink hover:border-white/20 transition-all duration-200"
        >
          {expanded ? (
            <><ChevronUp size={14} /> 收起</>
          ) : (
            <><ChevronDown size={14} /> 展开更多 ({movies.length - INITIAL_SHOW} 部)</>
          )}
        </button>
      )}
    </section>
  )
}

export function HomePage() {
  const [movies, setMovies] = useState<MovieItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadMovieData()
      .then(setMovies)
      .catch((e) => setError(e.message))
  }, [])

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />
  if (!movies) return <Loading message="加载豆瓣电影数据..." />

  const genres = getGenres(movies)
  const filtered = activeGenre ? getMoviesByGenre(movies, activeGenre) : movies

  return (
    <div className="max-w-7xl mx-auto">
      <WelcomePopup />
      <Banner />
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-ink">豆瓣高分电影</h2>
        <p className="text-[12px] text-muted mt-1">评分 ≥ 7.5 · {movies.length} 部 </p>
      </div>

      {/* Genre tabs */}
      <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setActiveGenre(null)}
          className={`pill text-[11px] cursor-pointer whitespace-nowrap transition-all duration-150
            ${!activeGenre ? '!bg-accent/15 !border-accent/30 !text-accent' : 'hover:border-white/20'}`}
        >
          全部 ({movies.length})
        </button>
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGenre(g === activeGenre ? null : g)}
            className={`pill text-[11px] cursor-pointer whitespace-nowrap transition-all duration-150
              ${g === activeGenre ? '!bg-accent/15 !border-accent/30 !text-accent' : 'hover:border-white/20'}`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Movie list */}
      {activeGenre ? (
        <GenreSection genre={activeGenre} movies={filtered as MovieItem[]} />
      ) : (
        genres.map((genre) => (
          <GenreSection key={genre} genre={genre} movies={getMoviesByGenre(movies, genre, 50)} />
        ))
      )}
    </div>
  )
}
