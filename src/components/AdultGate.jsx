import React, { useEffect, useState } from 'react'
import { createAdultPin, hasAdultPin, verifyAdultPin } from '../services/pinService'

export default function AdultGate({ onSuccess, onCancel }) {
  const [creating] = useState(() => !hasAdultPin())
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setError('')
  }, [pin, confirmPin])

  const submit = async event => {
    event.preventDefault()
    if (!/^\d{4}$/.test(pin)) {
      setError('Ingresá 4 números.')
      return
    }

    setBusy(true)
    try {
      if (creating) {
        if (pin !== confirmPin) {
          setError('Los PIN no coinciden.')
          return
        }
        await createAdultPin(pin)
        onSuccess()
        return
      }

      const ok = await verifyAdultPin(pin)
      if (!ok) {
        setError('PIN incorrecto.')
        return
      }
      onSuccess()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="adult-gate-overlay">
      <form className="adult-gate" onSubmit={submit}>
        <div className="adult-gate-icon">🔐</div>
        <p className="kicker">ACCESO ADULTO</p>
        <h2>{creating ? 'Creá un PIN de 4 números' : 'Ingresá tu PIN'}</h2>
        <p className="muted">
          {creating
            ? 'Se guarda solamente en este dispositivo y evita cambios accidentales en el plan.'
            : 'El modo Lautaro queda separado de configuraciones y estadísticas.'}
        </p>

        <input
          autoFocus
          inputMode="numeric"
          pattern="[0-9]*"
          type="password"
          value={pin}
          maxLength={4}
          onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0,4))}
          placeholder="••••"
          aria-label="PIN adulto"
        />

        {creating && (
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            type="password"
            value={confirmPin}
            maxLength={4}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0,4))}
            placeholder="Repetir PIN"
            aria-label="Repetir PIN adulto"
          />
        )}

        {error && <div className="adult-gate-error">{error}</div>}

        <button className="primary" disabled={busy}>{busy ? 'Verificando…' : creating ? 'Crear PIN y entrar' : 'Entrar'}</button>
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
      </form>
    </div>
  )
}
