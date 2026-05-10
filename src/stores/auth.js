import { ref, computed } from 'vue'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const LAST_ACTIVITY_KEY = 'last_activity'
const INACTIVITY_LIMIT = 5 * 60 * 60 * 1000

// ✅ Helper: JSON.parse aman tanpa crash
function safeParseJSON(val) {
  try {
    return JSON.parse(val)
  } catch {
    return null
  }
}

const token = ref(localStorage.getItem(TOKEN_KEY))
const userData = ref(safeParseJSON(localStorage.getItem(USER_KEY)))

let inactivityTimer = null

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

export const useAuth = () => {
  const isLoggedIn = computed(() => !!token.value && !!userData.value)
  const user = computed(() => userData.value)

  const isSessionExpired = () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
    if (!lastActivity) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
      return false
    }
    return Date.now() - parseInt(lastActivity) > INACTIVITY_LIMIT
  }

  const updateActivity = () => {
    if (token.value) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())
    }
  }

  // ✅ Stop dulu sebelum pasang — cegah listener duplikat
  const startActivityListeners = () => {
    stopActivityListeners()
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, updateActivity, { passive: true })
    })
  }

  const stopActivityListeners = () => {
    ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, updateActivity)
    })
  }

  const startInactivityWatcher = () => {
    clearInterval(inactivityTimer)
    inactivityTimer = setInterval(() => {
      if (isLoggedIn.value && isSessionExpired()) {
        clearAuth()
        window.location.href = '/login?reason=timeout'
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
    localStorage.removeItem('temp_email')
    localStorage.removeItem('fakultas_list')
    localStorage.removeItem('prodi_list')

    stopActivityListeners()
    clearInterval(inactivityTimer)
  }

  const initAuth = () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) return

    // ✅ safeParseJSON — tidak crash walau localStorage corrupt
    const storedUser = safeParseJSON(localStorage.getItem(USER_KEY))
    if (!storedUser) {
      clearAuth()
      return
    }

    token.value = storedToken
    userData.value = storedUser

    if (isSessionExpired()) {
      clearAuth()
      window.location.href = '/login?reason=timeout'
      return
    }

    startActivityListeners()
    startInactivityWatcher()
  }

  const updateUser = (newUser) => {
    userData.value = { ...userData.value, ...newUser }
    localStorage.setItem(USER_KEY, JSON.stringify(userData.value))
  }

  return { isLoggedIn, user, setAuth, clearAuth, initAuth, updateUser }
}
