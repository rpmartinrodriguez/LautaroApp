import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { auth, db, firebaseConfigured } from './firebase'

const LEARNER_ID = 'lautaro'
let currentUid = null
let authReadyPromise = null

export async function ensureCloudSession() {
  if (!firebaseConfigured || !auth || !db) {
    return { enabled: false, reason: 'not-configured' }
  }

  if (authReadyPromise) return authReadyPromise

  authReadyPromise = new Promise(async (resolve) => {
    try {
      await setPersistence(auth, browserLocalPersistence)
      const unsubscribe = onAuthStateChanged(auth, async user => {
        if (user) {
          currentUid = user.uid
          unsubscribe()
          resolve({ enabled: true, uid: user.uid })
          return
        }

        try {
          const credential = await signInAnonymously(auth)
          currentUid = credential.user.uid
          unsubscribe()
          resolve({ enabled: true, uid: credential.user.uid })
        } catch (error) {
          unsubscribe()
          resolve({ enabled: false, reason: error.code || error.message })
        }
      })
    } catch (error) {
      resolve({ enabled: false, reason: error.code || error.message })
    }
  })

  return authReadyPromise
}

function progressRef(uid) {
  return doc(db, 'users', uid, 'learners', LEARNER_ID)
}

export async function loadCloudProgress() {
  const session = await ensureCloudSession()
  if (!session.enabled) return { enabled: false, progress: null, reason: session.reason }

  const snap = await getDoc(progressRef(session.uid))
  if (!snap.exists()) return { enabled: true, progress: null }

  return {
    enabled: true,
    progress: snap.data()?.progress || null,
  }
}

export async function saveCloudProgress(progress) {
  const session = await ensureCloudSession()
  if (!session.enabled) return { enabled: false, reason: session.reason }

  await setDoc(
    progressRef(session.uid),
    {
      learnerId: LEARNER_ID,
      progress,
      updatedAt: serverTimestamp(),
      schemaVersion: 1,
    },
    { merge: true },
  )

  return { enabled: true }
}

export function mergeProgress(localProgress, remoteProgress) {
  if (!remoteProgress) return localProgress
  if (!localProgress) return remoteProgress

  const localXp = Number(localProgress.xp || 0)
  const remoteXp = Number(remoteProgress.xp || 0)

  // MVP: prefer the snapshot with more accumulated work.
  // Later this will be replaced by event-based multi-device reconciliation.
  return remoteXp > localXp ? { ...localProgress, ...remoteProgress } : localProgress
}
