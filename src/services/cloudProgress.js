import {
  browserLocalPersistence,
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
let bootstrapPromise = null

export async function ensureCloudSession() {
  if (!firebaseConfigured || !auth || !db) {
    return { enabled: false, reason: 'not-configured' }
  }

  if (auth.currentUser) {
    return { enabled: true, uid: auth.currentUser.uid }
  }

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence)
        if (auth.currentUser) return { enabled: true, uid: auth.currentUser.uid }

        const credential = await signInAnonymously(auth)
        return { enabled: true, uid: credential.user.uid }
      } catch (error) {
        return { enabled: false, reason: error.code || error.message }
      }
    })()
  }

  const result = await bootstrapPromise
  bootstrapPromise = null
  return result
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
      schemaVersion: 2,
    },
    { merge: true },
  )

  return { enabled: true }
}

export function mergeProgress(localProgress, remoteProgress) {
  if (!remoteProgress) return localProgress
  if (!localProgress) return remoteProgress

  const localEvents = Array.isArray(localProgress.events) ? localProgress.events : []
  const remoteEvents = Array.isArray(remoteProgress.events) ? remoteProgress.events : []
  const eventMap = new Map()

  ;[...remoteEvents, ...localEvents].forEach(event => {
    if (event?.id) eventMap.set(event.id, event)
  })

  const localXp = Number(localProgress.xp || 0)
  const remoteXp = Number(remoteProgress.xp || 0)
  const base = remoteXp > localXp
    ? { ...localProgress, ...remoteProgress }
    : { ...remoteProgress, ...localProgress }

  return {
    ...base,
    events: [...eventMap.values()]
      .sort((a,b) => String(a.at).localeCompare(String(b.at)))
      .slice(-600),
  }
}
