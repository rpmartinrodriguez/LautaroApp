const HASH_KEY = 'lautaro-adult-pin-hash'
const SALT_KEY = 'lautaro-adult-pin-salt'

function toHex(buffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function digest(pin, salt) {
  const data = new TextEncoder().encode(salt + ':' + pin)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return toHex(hash)
}

export function hasAdultPin() {
  return Boolean(localStorage.getItem(HASH_KEY) && localStorage.getItem(SALT_KEY))
}

export async function createAdultPin(pin) {
  if (!/^\d{4}$/.test(pin)) throw new Error('El PIN debe tener 4 números.')
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
  const hash = await digest(pin, salt)
  localStorage.setItem(SALT_KEY, salt)
  localStorage.setItem(HASH_KEY, hash)
  return true
}

export async function verifyAdultPin(pin) {
  const salt = localStorage.getItem(SALT_KEY)
  const expected = localStorage.getItem(HASH_KEY)
  if (!salt || !expected) return false
  return (await digest(pin, salt)) === expected
}

export function removeAdultPin() {
  localStorage.removeItem(HASH_KEY)
  localStorage.removeItem(SALT_KEY)
}
