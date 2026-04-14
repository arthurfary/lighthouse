import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { marked } from 'marked'
import { useReadingProgress, restorePosition } from '../hooks/useReadingProgress'

const metaModules = import.meta.glob('../../content/*/meta.json')
const chapterModules = import.meta.glob('../../content/*/*.md', { as: 'raw' })

// Normalise both meta shapes into one consistent object:
// { title, description, theme, isSingleChapter, chapters: [{ slug, title }] }
function normaliseMeta(raw) {
  if (raw.chapters) {
    return { ...raw, isSingleChapter: false }
  }
  // Single chapter — chapter: "story.md"
  const slug = raw.chapter.replace('.md', '')
  return {
    ...raw,
    isSingleChapter: true,
    chapters: [{ slug, title: raw.title }],
  }
}

function getActiveChapter(chapters) {
  const threshold = window.scrollY + window.innerHeight * 0.4
  let current = chapters[0].slug
  for (const ch of chapters) {
    const el = document.getElementById(ch.slug)
    if (el && el.offsetTop <= threshold) current = ch.slug
  }
  return current
}

export default function StoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [meta, setMeta] = useState(null)
  const [chapters, setChapters] = useState([])
  const [activeSlug, setActiveSlug] = useState('')

  const initialHash = useRef(location.hash.replace('#', ''))

  // Load + normalise meta
  useEffect(() => {
    setMeta(null)
    setChapters([])
    setActiveSlug('')
    initialHash.current = location.hash.replace('#', '')

    const key = Object.keys(metaModules).find(p => p.includes(`/${slug}/meta.json`))
    if (!key) return
    metaModules[key]().then(m => setMeta(normaliseMeta(m.default)))
  }, [slug])

  // Load chapters
  useEffect(() => {
    if (!meta) return
    Promise.all(
      meta.chapters.map(ch => {
        const key = Object.keys(chapterModules).find(p =>
          p.includes(`/${slug}/${ch.slug}.md`)
        )
        if (!key) return Promise.resolve({ ...ch, html: '<p><em>Chapter not found.</em></p>' })
        return chapterModules[key]().then(raw => ({ ...ch, html: marked(raw) }))
      })
    ).then(setChapters)
  }, [meta, slug])

  // Scroll to right place once chapters are in the DOM
  useEffect(() => {
    if (chapters.length === 0) return

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (initialHash.current) {
          const el = document.getElementById(initialHash.current)
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
          navigate(`/story/${slug}`, { replace: true })
          initialHash.current = ''
        } else {
          restorePosition(slug)
        }

        setTimeout(() => setActiveSlug(getActiveChapter(chapters)), 50)
      })
    })
  }, [chapters])

  // Live scroll tracking
  useEffect(() => {
    if (chapters.length === 0) return

    let timer = null
    function onScroll() {
      const current = getActiveChapter(chapters)
      setActiveSlug(current)

      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        useReadingProgress.save(slug, current)
      }, 400)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (timer) clearTimeout(timer)
    }
  }, [chapters, slug])

  if (!meta) return null

  return (
    <div className="app">
      <header className="story-page-header">
        <button className="back-link" onClick={() => navigate('/')}>← Lighthouse</button>
        <h1 className="site-title">{meta.title}</h1>
        <p className="story-description">{meta.description}</p>

        {!meta.isSingleChapter && (
          <nav className="chapter-nav">
            {meta.chapters.map((ch, i) => (
              <a
                key={ch.slug}
                href={`#${ch.slug}`}
                className={`chapter-nav-item ${activeSlug === ch.slug ? 'active' : ''}`}
                onClick={e => {
                  e.preventDefault()
                  setActiveSlug(ch.slug)
                  document.getElementById(ch.slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <span className="chapter-number">{String(i + 1).padStart(2, '0')}</span>
                {ch.title}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main className="chapters">
        {chapters.map(ch => (
          <article
            id={ch.slug}
            key={ch.slug}
            className={`chapter ${activeSlug === ch.slug ? 'chapter--active' : ''}`}
          >
            {!meta.isSingleChapter && (
              <h2 className="chapter-heading">{ch.title}</h2>
            )}
            <div className="chapter-body" dangerouslySetInnerHTML={{ __html: ch.html }} />
          </article>
        ))}
      </main>
    </div>
  )
}
