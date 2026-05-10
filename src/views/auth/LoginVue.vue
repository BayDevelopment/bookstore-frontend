<script setup>
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'
import Swal from 'sweetalert2'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const { setAuth } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const emailError = ref('')
const passwordError = ref('')

function clearErrors() {
  emailError.value = ''
  passwordError.value = ''
}

async function resendEmail() {
  try {
    await api.post('/email/resend', { email: email.value })
    Swal.fire({
      icon: 'success',
      title: 'Email Terkirim!',
      text: 'Silakan cek inbox atau folder spam kamu.',
      confirmButtonColor: '#2563eb',
    })
  } catch (error) {
    Swal.fire({
      icon: error.response?.status === 400 ? 'info' : 'error',
      title: error.response?.status === 400 ? 'Email Sudah Aktif' : 'Gagal',
      text: error.response?.status === 400 ? 'Silakan login.' : 'Terjadi kesalahan, coba lagi.',
      confirmButtonColor: '#2563eb',
    })
  }
}

async function handleLogin() {
  if (loading.value) return
  clearErrors()

  let hasError = false
  if (!email.value.trim()) {
    emailError.value = 'Email wajib diisi.'
    hasError = true
  }
  if (!password.value) {
    passwordError.value = 'Password wajib diisi.'
    hasError = true
  }
  if (hasError) return

  loading.value = true
  try {
    const res = await api.post('/login', {
      email: email.value,
      password: password.value,
    })

    setAuth(res.data.token, res.data.user)

    await Swal.fire({
      icon: 'success',
      title: 'Login Berhasil',
      text: 'Selamat datang kembali 👋',
      toast: true,
      position: 'top-end',
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    })

    router.push('/')
  } catch (error) {
    const status = error.response?.status
    const message = error.response?.data?.message ?? ''
    const errors = error.response?.data?.errors ?? {}

    if (status === 422) {
      if (errors.email) emailError.value = errors.email[0]
      if (errors.password) passwordError.value = errors.password[0]
    } else if (status === 401) {
      const isNotFound =
        message.toLowerCase().includes('tidak terdaftar') ||
        message.toLowerCase().includes('not found')

      if (isNotFound) {
        emailError.value = 'Email tidak terdaftar. Silakan daftar terlebih dahulu.'
      } else {
        emailError.value = 'Email atau password salah.'
        passwordError.value = 'Email atau password salah.'
      }
    } else if (status === 403) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Belum Diverifikasi',
        text: 'Kirim ulang email verifikasi?',
        showCancelButton: true,
        confirmButtonText: 'Kirim Ulang',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#2563eb',
      }).then((result) => {
        if (result.isConfirmed) resendEmail()
      })
    } else if (status === 429) {
      Swal.fire({
        icon: 'warning',
        title: 'Terlalu Banyak Percobaan',
        text: 'Coba lagi dalam 5 menit.',
        confirmButtonColor: '#2563eb',
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Terjadi kesalahan, coba lagi.',
        confirmButtonColor: '#2563eb',
      })
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (route.query.verified === '1') {
    Swal.fire({
      icon: 'success',
      title: 'Email Terverifikasi! ✅',
      text: 'Akun kamu sudah aktif, silakan login.',
      confirmButtonColor: '#2563eb',
    })
  } else if (route.query.verified === '0') {
    Swal.fire({
      icon: 'error',
      title: 'Verifikasi Gagal!',
      text: 'Link verifikasi tidak valid atau sudah expired.',
      confirmButtonColor: '#2563eb',
    })
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
    <!-- Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.12)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
      <div class="absolute inset-0 flex justify-center items-center">
        <div class="w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>
      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent animate-shine"
      ></div>
    </div>

    <!-- Card -->
    <div class="relative w-full max-w-md card-modern p-8">
      <!-- Title -->
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">📚</div>
        <h1 class="text-2xl font-semibold text-gray-800">Masuk ke Akun</h1>
        <p class="text-sm text-gray-400 mt-1">Silakan login untuk melanjutkan</p>
      </div>

      <!-- ✅ Pakai form + novalidate: hilangkan warning, Enter support, tidak reload -->
      <form class="space-y-5" @submit.prevent="handleLogin" novalidate>
        <!-- Email -->
        <div>
          <label class="text-sm text-gray-600" for="email">Email</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >📧</span
            >
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="email@contoh.com"
              autocomplete="email"
              :disabled="loading"
              @input="emailError = ''"
              :class="[
                'input-modern pl-10 disabled:opacity-50',
                emailError ? 'border-red-400 focus:ring-red-300' : '',
              ]"
            />
          </div>
          <p v-if="emailError" class="text-red-500 text-xs mt-1 pl-1 flex items-center gap-1">
            <span>⚠</span> {{ emailError }}
          </p>
        </div>

        <!-- Password -->
        <div>
          <label class="text-sm text-gray-600" for="password">Password</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >🔒</span
            >
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              autocomplete="current-password"
              :disabled="loading"
              @input="passwordError = ''"
              :class="[
                'input-modern pl-10 pr-10 disabled:opacity-50',
                passwordError ? 'border-red-400 focus:ring-red-300' : '',
              ]"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition text-sm"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <p v-if="passwordError" class="text-red-500 text-xs mt-1 pl-1 flex items-center gap-1">
            <span>⚠</span> {{ passwordError }}
          </p>
        </div>

        <!-- Forgot -->
        <div class="flex justify-end">
          <router-link to="/forgot-password" class="text-sm text-blue-600 hover:underline">
            Lupa password?
          </router-link>
        </div>

        <!-- ✅ type="submit" di dalam form — Enter otomatis trigger -->
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            v-if="loading"
            class="animate-spin h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          {{ loading ? 'Memproses...' : 'Login' }}
        </button>
      </form>

      <!-- Footer -->
      <p class="text-sm text-center text-gray-400 mt-6">
        Belum punya akun?
        <router-link to="/register" class="text-blue-600 hover:underline">Daftar</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
.animate-shine {
  animation: shine 6s linear infinite;
}
</style>
