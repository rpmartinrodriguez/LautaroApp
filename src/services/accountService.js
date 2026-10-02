import {
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth'
import { auth } from './firebase'
import { ensureCloudSession } from './cloudProgress'

export function subscribeAccount(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, user => callback(user))
}

export async function createAdultAccount(email, password) {
  await ensureCloudSession()
  if (!auth?.currentUser) throw new Error('No hay una sesión de Firebase disponible.')

  const credential = EmailAuthProvider.credential(email.trim(), password)
  const result = await linkWithCredential(auth.currentUser, credential)
  return result.user
}

export async function signInAdultAccount(email, password) {
  if (!auth) throw new Error('Firebase no está configurado.')
  const result = await signInWithEmailAndPassword(auth, email.trim(), password)
  return result.user
}

export async function changeAdultPassword(newPassword) {
  if (!auth?.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('Primero vinculá una cuenta adulta.')
  }
  await updatePassword(auth.currentUser, newPassword)
  return true
}

export function accountLabel(user) {
  if (!user) return 'Sin conexión'
  if (user.isAnonymous) return 'Sesión anónima'
  return user.email || 'Cuenta adulta'
}
