import { useState } from 'react'
import { consentAnswered, giveConsent, declineConsent } from '../hooks/useReadingProgress'

export default function ConsentBanner({ onAnswer }) {
  const [visible, setVisible] = useState(!consentAnswered())

  if (!visible) return null

  function handle(accept) {
    accept ? giveConsent() : declineConsent()
    setVisible(false)
    onAnswer?.()
  }

  return (
    <div className="consent-banner">
      <p className="consent-text">
        This site can remember which chapter you last read — stored only in your
        browser, never sent anywhere. That's all.
      </p>
      <div className="consent-actions">
        <button className="consent-btn consent-btn--accept" onClick={() => handle(true)}>
          Sure
        </button>
        <button className="consent-btn consent-btn--decline" onClick={() => handle(false)}>
          No thanks
        </button>
      </div>
    </div>
  )
}
