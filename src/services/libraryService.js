import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { db, storage } from './firebase'
import { ensureCloudSession } from './cloudProgress'

const LOCAL_KEY = 'lautaro-concepts-v1'

function loadLocal() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocal(items) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
}

function normalizeConcept(input, id) {
  const word = String(input.word || '').trim().toUpperCase()
  return {
    id,
    word,
    emoji: input.emoji?.trim() || '⭐',
    category: input.category?.trim() || 'Personal',
    syllables: String(input.syllables || '')
      .split(/[-,\s]+/)
      .map(value => value.trim().toUpperCase())
      .filter(Boolean),
    imageUrl: input.imageUrl || null,
    storagePath: input.storagePath || null,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function listConcepts() {
  const local = loadLocal()
  const session = await ensureCloudSession()

  if (!session.enabled || !db) return { items: local, cloud: false }

  try {
    const snapshot = await getDocs(collection(db, 'users', session.uid, 'concepts'))
    const cloudItems = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))

    const mergedMap = new Map()
    local.forEach(item => mergedMap.set(item.id, item))
    cloudItems.forEach(item => mergedMap.set(item.id, item))

    const merged = [...mergedMap.values()].sort((a, b) =>
      String(a.word).localeCompare(String(b.word), 'es')
    )
    saveLocal(merged)
    return { items: merged, cloud: true }
  } catch {
    return { items: local, cloud: false }
  }
}

export async function createConcept(input, imageFile = null) {
  const id = crypto.randomUUID()
  let concept = normalizeConcept(input, id)

  const existing = loadLocal()
  saveLocal([...existing, concept])

  const session = await ensureCloudSession()
  if (!session.enabled || !db) return { concept, cloud: false }

  try {
    if (imageFile && storage) {
      const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = 'users/' + session.uid + '/concepts/' + id + '/' + safeName
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, imageFile, { contentType: imageFile.type })
      concept = {
        ...concept,
        imageUrl: await getDownloadURL(storageRef),
        storagePath: path,
      }
    }

    await setDoc(doc(db, 'users', session.uid, 'concepts', id), {
      ...concept,
      createdAtServer: serverTimestamp(),
      updatedAtServer: serverTimestamp(),
    })

    const nextLocal = loadLocal().map(item => item.id === id ? concept : item)
    saveLocal(nextLocal)
    return { concept, cloud: true }
  } catch (error) {
    return { concept, cloud: false, error: error.code || error.message }
  }
}

export async function removeConcept(concept) {
  saveLocal(loadLocal().filter(item => item.id !== concept.id))

  const session = await ensureCloudSession()
  if (!session.enabled || !db) return { cloud: false }

  try {
    await deleteDoc(doc(db, 'users', session.uid, 'concepts', concept.id))
    if (concept.storagePath && storage) {
      try {
        await deleteObject(ref(storage, concept.storagePath))
      } catch {
        // A missing image must not block deletion of the concept.
      }
    }
    return { cloud: true }
  } catch (error) {
    return { cloud: false, error: error.code || error.message }
  }
}
