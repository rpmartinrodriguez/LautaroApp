import React, { useEffect, useState } from 'react'
import {
  accountLabel,
  changeAdultPassword,
  createAdultAccount,
  signInAdultAccount,
  subscribeAccount,
} from '../services/accountService'
import { loadCloudProgress, mergeProgress, saveCloudProgress } from '../services/cloudProgress'
import { loadProgress, saveProgress } from '../services/progressEngine'

function messageFor(error) {
  const code = error?.code || ''
  if (code.includes('email-already-in-use') || code.includes('credential-already-in-use')) return 'Ese correo ya tiene una cuenta. Usá “Entrar en otro dispositivo”.'
  if (code.includes('invalid-credential') || code.includes('wrong-password')) return 'Correo o contraseña incorrectos.'
  if (code.includes('weak-password')) return 'Usá una contraseña de al menos 6 caracteres.'
  if (code.includes('operation-not-allowed')) return 'Falta habilitar Email/Password en Firebase Authentication.'
  return error?.message || 'No pudimos completar la operación.'
}

export default function AccountPanel({ progress, onProgressChange }) {
  const [user, setUser] = useState(null)
  const [mode, setMode] = useState('link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeAccount(setUser), [])

  const syncAfterAuth = async () => {
    const remote = await loadCloudProgress()
    const merged = mergeProgress(progress || loadProgress(), remote.progress)
    saveProgress(merged)
    await saveCloudProgress(merged)
    onProgressChange?.(merged)
  }

  const submit = async event => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      if (mode === 'link') {
        await createAdultAccount(email, password)
        await saveCloudProgress(progress)
        setMessage('Cuenta vinculada. Este progreso ya puede recuperarse en otro dispositivo.')
      } else {
        await signInAdultAccount(email, password)
        await syncAfterAuth()
        setMessage('Cuenta conectada y progreso sincronizado.')
      }
      setPassword('')
    } catch (error) {
      setMessage(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  const updatePass = async event => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await changeAdultPassword(newPassword)
      setNewPassword('')
      setMessage('Contraseña actualizada.')
    } catch (error) {
      setMessage(messageFor(error))
    } finally {
      setBusy(false)
    }
  }

  const linked = Boolean(user && !user.isAnonymous)

  return (
    <div className="account-panel">
      <section className="account-status">
        <div className="account-icon">{linked ? '☁️' : '🔗'}</div>
        <div>
          <p className="kicker">CUENTA ADULTA</p>
          <h2>{accountLabel(user)}</h2>
          <p className="muted">
            {linked
              ? 'El mismo progreso puede recuperarse iniciando sesión en otro dispositivo.'
              : 'Ahora el progreso pertenece a esta instalación. Vincular una cuenta evita perderlo si cambiás de equipo.'}
          </p>
        </div>
      </section>

      {!linked ? (
        <>
          <div className="account-tabs">
            <button className={mode === 'link' ? 'active' : ''} onClick={() => setMode('link')}>Crear / vincular cuenta</button>
            <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Entrar en otro dispositivo</button>
          </div>

          <form className="account-form" onSubmit={submit}>
            <label>
              <span>Correo</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label>
              <span>Contraseña</span>
              <input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required />
            </label>
            <button className="primary" disabled={busy}>{busy ? 'Procesando…' : mode === 'link' ? 'Vincular cuenta' : 'Iniciar sesión'}</button>
          </form>

          <div className="account-note">
            <b>Antes de usarlo</b>
            <p>En Firebase Authentication tenés que habilitar el proveedor <strong>Email/Password</strong>. La sesión anónima actual se convierte en tu cuenta sin cambiar el UID, por lo que conserva los datos.</p>
          </div>
        </>
      ) : (
        <form className="account-form compact-account" onSubmit={updatePass}>
          <label>
            <span>Nueva contraseña</span>
            <input type="password" minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </label>
          <button className="secondary" disabled={busy}>Cambiar contraseña</button>
        </form>
      )}

      {message && <div className="account-message">{message}</div>}
    </div>
  )
}
