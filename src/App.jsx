import { useState, useEffect, useRef, useMemo } from 'react'

const SOURCES = [
  { id: 'reddit', label: 'Reddit', color: '#ff4500', domain: 'reddit.com' },
  { id: 'x', label: 'X', color: '#000', domain: 'x.com' },
  { id: 'substack', label: 'Substack', color: '#ff6719', domain: 'substack.com' },
  { id: 'axios', label: 'Axios', color: '#008fd5', domain: 'axios.com' },
  { id: 'techcrunch', label: 'TechCrunch', color: '#00a562', domain: 'techcrunch.com' },
  { id: 'arxiv', label: 'arXiv', color: '#b31b1b', domain: 'arxiv.org' },
]

const FAVICON_URL = (domain, size = 32) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`

const SEED_ARTICLES = [
  { title: 'GPT-5 rumors: major capability jump', sentiment: 1, source: 'x', url: 'https://example.com/1' },
  { title: 'OpenAI safety researchers resign', sentiment: -1, source: 'axios', url: 'https://example.com/2' },
  { title: 'Local LLMs now match GPT-4 on benchmarks', sentiment: 1, source: 'reddit', url: 'https://example.com/3' },
  { title: 'AI job displacement report sparks debate', sentiment: -1, source: 'substack', url: 'https://example.com/4' },
  { title: 'New open-source model hits top of leaderboard', sentiment: 1, source: 'techcrunch', url: 'https://example.com/5' },
  { title: 'Regulators propose strict AI liability rules', sentiment: -1, source: 'axios', url: 'https://example.com/6' },
  { title: 'AI-assisted coding boosts productivity 40%', sentiment: 1, source: 'substack', url: 'https://example.com/7' },
  { title: 'Deepfake scandals prompt new legislation', sentiment: -1, source: 'reddit', url: 'https://example.com/8' },
  { title: 'Multimodal agents go mainstream', sentiment: 1, source: 'x', url: 'https://example.com/9' },
  { title: 'Training costs could limit smaller labs', sentiment: -1, source: 'arxiv', url: 'https://example.com/10' },
]

const POINT_SPACING = 120
const THUMB_SIZE = 56
const CHART_HEIGHT = 280
const CHART_PADDING_X = 80
const CHART_PADDING_Y = 60
const Y_SCALE = 12
const MAX_ENTRIES = 50

function getSource(sourceId) {
  return SOURCES.find((s) => s.id === sourceId) || SOURCES[0]
}

function generateNextArticle() {
  const article = SEED_ARTICLES[Math.floor(Math.random() * SEED_ARTICLES.length)]
  return { ...article, id: crypto.randomUUID() }
}

export default function App() {
  const [events, setEvents] = useState(() => {
    return SEED_ARTICLES.slice(0, 5).map((a, i) => ({
      ...a,
      id: `seed-${i}`,
      cumulative: SEED_ARTICLES.slice(0, i + 1).reduce((sum, e) => sum + e.sentiment, 0),
    }))
  })
  const scrollRef = useRef(null)

  useEffect(() => {
    const t = setInterval(() => {
      setEvents((prev) => {
        const next = generateNextArticle()
        const trimmed = prev.length >= MAX_ENTRIES ? prev.slice(1) : prev
        const withNew = [...trimmed, { ...next }]
        return withNew.map((e, i, arr) => ({
          ...e,
          cumulative: arr.slice(0, i + 1).reduce((s, x) => s + x.sentiment, 0),
        }))
      })
    }, 2200)
    return () => clearInterval(t)
  }, [])

  const points = useMemo(() => {
    const centerY = CHART_HEIGHT / 2
    return events.map((e, i) => ({
      x: CHART_PADDING_X + i * POINT_SPACING,
      y: centerY - e.cumulative * Y_SCALE,
      ...e,
    }))
  }, [events])

  const scoreboard = useMemo(() => {
    const positive = events.filter((e) => e.sentiment > 0).length
    const negative = events.filter((e) => e.sentiment < 0).length
    const score = positive - negative
    return { score, positive, negative }
  }, [events])

  const totalWidth = CHART_PADDING_X * 2 + (events.length - 1) * POINT_SPACING
  const viewWidth = typeof window !== 'undefined' ? Math.max(800, window.innerWidth - 80) : 1000

  const areaPathD = useMemo(() => {
    if (points.length < 2) return ''
    const centerY = CHART_HEIGHT / 2
    const first = points[0]
    const last = points[points.length - 1]
    let d = `M ${first.x} ${centerY} L ${last.x} ${centerY} L ${last.x} ${last.y}`
    for (let i = points.length - 2; i >= 0; i--) {
      d += ` L ${points[i].x} ${points[i].y}`
    }
    d += ' Z'
    return d
  }, [points])

  useEffect(() => {
    if (!scrollRef.current || totalWidth <= viewWidth) return
    scrollRef.current.scrollLeft = totalWidth - viewWidth
  }, [events.length, totalWidth, viewWidth])

  const SIDEBAR_WIDTH = 320

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', minHeight: 0, height: '100%' }}>
      <header style={{ marginBottom: '16px', flexShrink: 0, borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1.25rem', margin: 0 }}>
          Sentibeat — AI Sentiment Pulse
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>
          Cumulative sentiment · Green = positive, Red = negative
        </p>
      </header>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Chart: takes remaining space */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflowX: 'auto',
            overflowY: 'hidden',
            minWidth: 0,
            minHeight: CHART_HEIGHT + CHART_PADDING_Y * 2,
            background: 'var(--panel)',
            borderRadius: '8px',
            border: '1px solid var(--border)',
          }}
        >
        <div style={{ position: 'relative', width: totalWidth, height: CHART_HEIGHT + CHART_PADDING_Y * 2, flexShrink: 0 }}>
          {/* Background layer: grid + baseline only */}
          <svg
            width={totalWidth}
            height={CHART_HEIGHT + CHART_PADDING_Y * 2}
            style={{ display: 'block', position: 'relative', zIndex: 0 }}
          >
            <defs>
              <pattern id="chartGrid" width={20} height={20} patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--border)" strokeWidth={0.5} opacity={0.4} />
              </pattern>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2={CHART_HEIGHT} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="var(--positive)" stopOpacity="0.35" />
                <stop offset="0.5" stopColor="var(--positive)" stopOpacity="0" />
                <stop offset="0.5" stopColor="var(--negative)" stopOpacity="0" />
                <stop offset="1" stopColor="var(--negative)" stopOpacity="0.35" />
              </linearGradient>
            </defs>
            <g transform={`translate(0, ${CHART_PADDING_Y})`}>
              <rect x={0} y={0} width={totalWidth} height={CHART_HEIGHT} fill="url(#chartGrid)" />
              {areaPathD && (
                <path d={areaPathD} fill="url(#areaGradient)" stroke="none" />
              )}
              <line
                x1={CHART_PADDING_X}
                y1={CHART_HEIGHT / 2}
                x2={totalWidth - CHART_PADDING_X}
                y2={CHART_HEIGHT / 2}
                stroke="var(--border)"
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.6}
              />
            </g>
          </svg>

          {/* Line: div segments connecting each thumbnail (guaranteed to render) */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: totalWidth,
              height: CHART_HEIGHT + CHART_PADDING_Y * 2,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {points.length > 1 &&
              points.slice(0, -1).map((_, i) => {
                const p0 = points[i]
                const p1 = points[i + 1]
                const x0 = p0.x
                const y0 = CHART_PADDING_Y + p0.y
                const x1 = p1.x
                const y1 = CHART_PADDING_Y + p1.y
                const dx = x1 - x0
                const dy = y1 - y0
                const length = Math.sqrt(dx * dx + dy * dy)
                const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI
                const lineHeight = 4
                return (
                  <div
                    key={`line-${p0.id}-${p1.id}`}
                    style={{
                      position: 'absolute',
                      left: x0,
                      top: y0 - lineHeight / 2,
                      width: length,
                      height: lineHeight,
                      background: '#fff',
                      transformOrigin: '0 50%',
                      transform: `rotate(${angleDeg}deg)`,
                      borderRadius: 2,
                      boxShadow: '0 0 6px rgba(255, 255, 255, 0.4)',
                    }}
                  />
                )
              })}
          </div>

          {/* Thumbnails on top */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: totalWidth,
              height: CHART_HEIGHT + CHART_PADDING_Y * 2,
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            {points.map((p) => (
              <Thumbnail key={p.id} point={p} chartPaddingY={CHART_PADDING_Y} />
            ))}
          </div>
        </div>
        </div>

        {/* Right sidebar: scoreboard + latest articles */}
        <aside
          style={{
            width: SIDEBAR_WIDTH,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '24px',
              padding: '14px 16px',
              background: 'var(--panel)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '2px' }}>
                SCORE
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: scoreboard.score >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                {scoreboard.score >= 0 ? `+${scoreboard.score}` : scoreboard.score}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '2px' }}>
                POSITIVE
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--positive)' }}>
                {scoreboard.positive}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '2px' }}>
                NEGATIVE
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 600, color: '#ea580c' }}>
                {scoreboard.negative}
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
              background: 'var(--panel)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                margin: 0,
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}
            >
              LATEST
            </h2>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '8px' }}>
              {[...events].reverse().map((entry) => (
                <ArticleCard key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer style={{ marginTop: '16px', flexShrink: 0, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {SOURCES.map((s) => (
          <span
            key={s.id}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color }} />
            {s.label}
          </span>
        ))}
      </footer>
    </div>
  )
}

function ArticleCard({ entry }) {
  const source = getSource(entry.source)
  const isPositive = entry.sentiment > 0
  return (
    <a
      href={entry.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        gap: '12px',
        padding: '10px 8px',
        borderRadius: '6px',
        textDecoration: 'none',
        color: 'var(--text)',
        marginBottom: '4px',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--border)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: '6px',
          border: `2px solid ${isPositive ? 'var(--positive)' : 'var(--negative)'}`,
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <img
          src={FAVICON_URL(source.domain, 64)}
          alt=""
          width={24}
          height={24}
          style={{ width: 24, height: 24, objectFit: 'contain' }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '0.8rem',
            fontWeight: 500,
            lineHeight: 1.3,
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {entry.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {source.label}
          <span style={{ color: isPositive ? 'var(--positive)' : 'var(--negative)', fontSize: '0.65rem' }}>
            {isPositive ? '▲' : '▼'}
          </span>
        </div>
      </div>
    </a>
  )
}

function Thumbnail({ point, chartPaddingY }) {
  const source = getSource(point.source)
  const isPositive = point.sentiment > 0
  const centerX = point.x
  const centerY = chartPaddingY + point.y

  return (
    <a
      href={point.url}
      target="_blank"
      rel="noopener noreferrer"
      title={point.title}
      style={{
        position: 'absolute',
        left: centerX - THUMB_SIZE / 2,
        top: centerY - THUMB_SIZE / 2,
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: '50%',
        border: `2px solid ${isPositive ? 'var(--positive)' : 'var(--negative)'}`,
        background: 'var(--bg)',
        boxShadow: isPositive ? '0 0 12px var(--positive-glow)' : '0 0 12px var(--negative-glow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        pointerEvents: 'auto',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.zIndex = 10
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.zIndex = 0
      }}
    >
      <img
        src={FAVICON_URL(source.domain, 64)}
        alt=""
        width={32}
        height={32}
        style={{ width: 28, height: 28, objectFit: 'contain' }}
      />
    </a>
  )
}
