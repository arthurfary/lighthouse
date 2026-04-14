import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLastChapter, hasConsent } from '../hooks/useReadingProgress'
import ConsentBanner from '../components/ConsentBanner'

const metaModules = import.meta.glob('../../content/*/meta.json')

// Same normalisation as StoryPage — always produces { ...meta, slug, isSingleChapter, chapters[] }
function normaliseMeta(raw, slug) {
  if (raw.chapters) {
    return { ...raw, slug, isSingleChapter: false }
  }
  const chSlug = raw.chapter.replace('.md', '')
  return {
    ...raw,
    slug,
    isSingleChapter: true,
    chapters: [{ slug: chSlug, title: raw.title }],
  }
}

function useStories() {
  const [stories, setStories] = useState([])

  useEffect(() => {
    Promise.all(
      Object.entries(metaModules).map(([path, load]) =>
        load().then(m => {
          const slug = path.split('/').at(-2)
          return normaliseMeta(m.default, slug)
        })
      )
    ).then(setStories)
  }, [])

  return stories
}

function ChapterList({ slug, chapters, isSingleChapter }) {
  const navigate = useNavigate()
  const lastRead = hasConsent() ? getLastChapter(slug) : null

  // Single chapter — clicking the card goes straight to the story, no dropdown needed
  if (isSingleChapter) {
    return (
      <ul className="chapter-list">
        <li
          className="chapter-item"
          onClick={() => navigate(`/story/${slug}`)}
        >
          <span className="chapter-title">Read</span>
          {lastRead && <span className="last-read-badge">continue reading</span>}
        </li>
      </ul>
    )
  }

  return (
    <ul className="chapter-list">
      {chapters.map((ch, i) => (
        <li
          key={ch.slug}
          className="chapter-item"
          onClick={() => navigate(`/story/${slug}#${ch.slug}`)}
        >
          <span className="chapter-number">{String(i + 1).padStart(2, '0')}</span>
          <span className="chapter-title">{ch.title}</span>
          {lastRead === ch.slug && (
            <span className="last-read-badge">last read</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function StoryCard({ story }) {
  const [open, setOpen] = useState(false)
  const lastRead = hasConsent() ? getLastChapter(story.slug) : null

  return (
    <div className={`story-card ${open ? 'open' : ''}`}>
      <button className="story-header" onClick={() => setOpen(o => !o)}>
        <div className="story-info">
          <h2 className="story-title">{story.title}</h2>
          <p className="story-description">{story.description}</p>
          {lastRead && <span className="resume-hint">↩ continue reading</span>}
        </div>
        <span className="story-arrow">{open ? '↑' : '↓'}</span>
      </button>

      {open && (
        <ChapterList
          slug={story.slug}
          chapters={story.chapters}
          isSingleChapter={story.isSingleChapter}
        />
      )}
    </div>
  )
}

export default function Home() {
  const stories = useStories()
  const [, forceUpdate] = useState(0)

  return (
    <div className="app">
      <ConsentBanner onAnswer={() => forceUpdate(n => n + 1)} />

      <header className="site-header">
        <h1 className="site-title">Lighthouse</h1>
        <p className="site-subtitle">A collection of short stories</p>
      </header>

      <main className="story-list">
        {stories.map(story => (
          <StoryCard key={story.slug} story={story} />
        ))}
      </main>
    </div>
  )
}
