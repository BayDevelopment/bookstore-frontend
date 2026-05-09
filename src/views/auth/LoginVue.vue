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
const showPassword = ref(false) // ✅ [FIX] toggle show/hide password

const resendEmail = async () => {
  try {
    await api.post('/email/resend', { email: email.value })
    Swal.fire({
      icon: 'success',
      title: 'Email Terkirim!',
      text: 'Silakan cek inbox atau folder spam kamu.',
      confirmButtonColor: '#2563eb',
    })
  } catch (error) {
    if (error.response?.status === 400) {
      Swal.fire({
        icon: 'info',
        title: 'Email Sudah Aktif',
        text: 'Silakan login.',
        confirmButtonColor: '#2563eb',
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Terjadi kesalahan, coba lagi.',
        confirmButtonColor: '#2563eb',
      })
    }
  }
}

const handleLogin = async () => {
  if (loading.value) return

  // ✅ [FIX] Validasi input sebelum hit API
  if (!email.value.trim() || !password.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Form Tidak Lengkap',
      text: 'Email dan password wajib diisi.',
      confirmButtonColor: '#2563eb',
    })
    return
  }

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
    if (error.response?.status === 403) {
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
    } else if (error.response?.status === 401) {
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: 'Email atau password salah.',
        confirmButtonColor: '#2563eb',
      })
    } else if (error.response?.status === 429) {
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

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-5">
        <!-- Email -->
        <div>
          <label class="text-sm text-gray-600">Email</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >📧</span
            >
            <input
              v-model="email"
              type="email"
              placeholder="Email"
              autocomplete="email"
              :disabled="loading"
              class="input-modern pl-10 disabled:opacity-50"
            />
          </div>
        </div>

        <!-- Password -->
        <div>
          <label class="text-sm text-gray-600">Password</label>
          <!-- ✅ [FIX] Toggle show/hide password -->
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >🔒</span
            >
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              autocomplete="current-password"
              :disabled="loading"
              class="input-modern pl-10 pr-10 disabled:opacity-50"
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
        </div>

        <!-- Forgot -->
        <div class="flex justify-end">
          <router-link to="/forgot-password" class="text-sm text-blue-600 hover:underline">
            Lupa password?
          </router-link>
        </div>

        <!-- Button -->
        <button
          type="submit"
          :disabled="loading"
          class="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            v-if="loading"
            class="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
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
