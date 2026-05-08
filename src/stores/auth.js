import { ref, computed } from 'vue'

const token = ref(localStorage.getItem('token'))
const userData = ref(JSON.parse(localStorage.getItem('user') || 'null'))

export const useAuth = () => {
  const isLoggedIn = computed(() => !!token.value && !!userData.value)
  const user = computed(() => userData.value)

  const setAuth = (newToken, newUser) => {
    token.value = newToken
    userData.value = newUser
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  const clearAuth = () => {
    token.value = null
    userData.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { isLoggedIn, user, setAuth, clearAuth }
}
