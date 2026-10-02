import React, { useEffect, useState } from 'react'

export default function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(() => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
  const [showIosHelp, setShowIosHelp] = useState(false)

  useEffect(() => {
    const onPrompt = event => {
      event.preventDefault()
      setPromptEvent(event)
    }

    const onInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) {
    return <div className="install-status">✓ App instalada</div>
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

  const install = async () => {
    if (promptEvent) {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') setPromptEvent(null)
      return
    }

    if (isIos) setShowIosHelp(true)
  }

  if (!promptEvent && !isIos) return null

  return (
    <>
      <button className="install-button" onClick={install}>📲 Instalar app</button>
      {showIosHelp && (
        <div className="install-help">
          <div>
            <b>Instalar en iPhone o iPad</b>
            <button onClick={() => setShowIosHelp(false)}>×</button>
          </div>
          <p>1. Abrí esta página en Safari.</p>
          <p>2. Tocá el botón Compartir.</p>
          <p>3. Elegí “Agregar a inicio”.</p>
          <p>4. Confirmá “Agregar”.</p>
        </div>
      )}
    </>
  )
}
