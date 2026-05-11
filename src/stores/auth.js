import { ref, computed } from 'vue'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const LAST_ACTIVITY_KEY = 'last_activity'
const INACTIVITY_LIMIT = 5 * 60 * 60 * 1000

// ✅ SAFE PARSE (ANTI CRASH MOBILE)
const safeParse = (data) => {
  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

const token = ref(localStorage.getItem(TOKEN_KEY))
const userData = ref(safeParse(localStorage.getItem(USER_KEY)))

let inactivityTimer = null
let listenersActive = false

// ✅ OPTIMASI MOBILE (buang event berat)
const ACTIVITY_EVENTS = ['touchstart', 'click', 'keydown']

export const useAuth = () => {
  const isLoggedIn = computed(() => !!token.value && !!userData.value)
  const user = computed(() => userData.value)

  const isSessionExpired = () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)

    if (!lastActivity) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
      return false
    }

    const last = parseInt(lastActivity, 10)
    if (isNaN(last) || last <= 0 || last > Date.now()) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
      return false
    }

    return Date.now() - last > INACTIVITY_LIMIT
  }

  const updateActivity = () => {
    if (token.value) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }
  }

  const startActivityListeners = () => {
    if (listenersActive) return
    listenersActive = true

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true })
    })
  }

  const stopActivityListeners = () => {
    if (!listenersActive) return
    listenersActive = false

    ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, updateActivity)
    })
  }

  const startInactivityWatcher = () => {
    clearInterval(inactivityTimer)
    inactivityTimer = setInterval(() => {
      if (isLoggedIn.value && isSessionExpired()) {
        clearAuth()
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
    }, 60 * 1000)
  }

  const setAuth = (newToken, newUser) => {
    token.value = newToken
    userData.value = newUser
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())

    startActivityListeners()
    startInactivityWatcher()
  }

  const clearAuth = () => {
    token.value = null
    userData.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(LAST_ACTIVITY_KEY)

    stopActivityListeners()
    clearInterval(inactivityTimer)
    inactivityTimer = null
  }

  const initAuth = () => {
    try {
      if (!token.value) return { valid: false, reason: 'no_token' }

      if (isSessionExpired()) {
        clearAuth()
        return { valid: false, reason: 'timeout' }
      }

      startActivityListeners()
      startInactivityWatcher()
      return { valid: true }
    } catch (e) {
      clearAuth()
      return { valid: false, reason: 'error' }
    }
  }

  return { isLoggedIn, user, setAuth, clearAuth, initAuth }
}
