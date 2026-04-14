const STORAGE_KEY = 'lighthouse_progress'
const CONSENT_KEY = 'lighthouse_consent'

export function hasConsent() {
  return localStorage.getItem(CONSENT_KEY) === 'yes'
}

export function giveConsent() {
  localStorage.setItem(CONSENT_KEY, 'yes')
}

export function declineConsent() {
  localStorage.setItem(CONSENT_KEY, 'no')
}

export function consentAnswered() {
  return localStorage.getItem(CONSENT_KEY) !== null
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

// Attach save as a static method so StoryPage can call useReadingProgress.save()
useReadingProgress.save = function (storySlug, chapterSlug) {
  if (!hasConsent()) return
  const all = loadProgress()
  all[storySlug] = chapterSlug
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

export function getLastChapter(storySlug) {
  if (!hasConsent()) return null
  return loadProgress()[storySlug] ?? null
}

export function restorePosition(storySlug) {
  const chapterSlug = getLastChapter(storySlug)
  if (!chapterSlug) return
  const el = document.getElementById(chapterSlug)
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
}

// No longer a hook — just a named export so imports don't break
export function useReadingProgress() { }
