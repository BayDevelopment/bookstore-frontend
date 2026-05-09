<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import Swal from 'sweetalert2'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const token = route.query.token ?? ''
const email = route.query.email ?? ''

// ✅ Cek syarat password real-time
const passwordChecks = computed(() => ({
  length: password.value.length >= 8,
  upper: /[A-Z]/.test(password.value),
  lower: /[a-z]/.test(password.value),
  number: /[0-9]/.test(password.value),
  symbol: /[^A-Za-z0-9]/.test(password.value),
}))

const passwordStrength = computed(() => {
  const passed = Object.values(passwordChecks.value).filter(Boolean).length
  if (passed <= 2) return { label: 'Lemah', color: 'bg-red-400', width: 'w-1/5' }
  if (passed === 3) return { label: 'Cukup', color: 'bg-yellow-400', width: 'w-3/5' }
  if (passed === 4) return { label: 'Kuat', color: 'bg-blue-400', width: 'w-4/5' }
  return { label: 'Sangat Kuat', color: 'bg-green-500', width: 'w-full' }
})

const passwordReady = computed(() => Object.values(passwordChecks.value).every(Boolean))
const passwordMatched = computed(
  () => passwordConfirmation.value && password.value === passwordConfirmation.value,
)
const canSubmit = computed(() => passwordReady.value && passwordMatched.value && !loading.value)

onMounted(() => {
  if (!token || !email) {
    Swal.fire({
      icon: 'error',
      title: 'Link Tidak Valid',
      text: 'Link reset password tidak valid atau sudah expired.',
      confirmButtonColor: '#2563eb',
    }).then(() => router.push('/forgot-password'))
  }
})

const handleReset = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    await api.post('/reset-password', {
      token,
      email,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    await Swal.fire({
      icon: 'success',
      title: 'Password Berhasil Direset!',
      text: 'Silakan login dengan password baru kamu.',
      confirmButtonColor: '#2563eb',
    })

    router.push('/login')
  } catch (error) {
    const errors = error.response?.data?.errors
    if (errors) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: Object.values(errors)[0][0],
        confirmButtonColor: '#2563eb',
      })
    } else if (error.response?.status === 422) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.response?.data?.message ?? 'Token tidak valid atau sudah expired.',
        confirmButtonColor: '#2563eb',
      })
    } else if (error.response?.status === 429) {
      Swal.fire({
        icon: 'warning',
        title: 'Terlalu Banyak Percobaan',
        text: 'Coba lagi dalam beberapa menit.',
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
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
      <!-- Icon & Title -->
      <div class="text-center mb-6">
        <div class="text-4xl mb-3">🔒</div>
        <h1 class="text-xl font-semibold text-gray-800">Reset Password</h1>
        <p class="text-sm text-gray-500 mt-1">Buat password baru untuk akunmu</p>
      </div>

      <!-- Input Password Baru -->
      <div class="mb-4">
        <label class="text-xs text-gray-500 mb-1 block">Password Baru</label>
        <input
          v-model="password"
          type="password"
          placeholder="Password baru"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <!-- Strength Bar -->
        <div v-if="password" class="mt-2">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-400">Kekuatan password</span>
            <span
              class="text-xs font-semibold"
              :class="{
                'text-red-500': passwordStrength.label === 'Lemah',
                'text-yellow-500': passwordStrength.label === 'Cukup',
                'text-blue-500': passwordStrength.label === 'Kuat',
                'text-green-600': passwordStrength.label === 'Sangat Kuat',
              }"
              >{{ passwordStrength.label }}</span
            >
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-300"
              :class="[passwordStrength.color, passwordStrength.width]"
            ></div>
          </div>

          <!-- Checklist -->
          <div class="mt-2 grid grid-cols-2 gap-1">
            <div
              class="flex items-center gap-1.5 text-xs"
              :class="passwordChecks.length ? 'text-green-600' : 'text-gray-400'"
            >
              {{ passwordChecks.length ? '✓' : '○' }} Min. 8 karakter
            </div>
            <div
              class="flex items-center gap-1.5 text-xs"
              :class="passwordChecks.upper ? 'text-green-600' : 'text-gray-400'"
            >
              {{ passwordChecks.upper ? '✓' : '○' }} Huruf besar (A-Z)
            </div>
            <div
              class="flex items-center gap-1.5 text-xs"
              :class="passwordChecks.lower ? 'text-green-600' : 'text-gray-400'"
            >
              {{ passwordChecks.lower ? '✓' : '○' }} Huruf kecil (a-z)
            </div>
            <div
              class="flex items-center gap-1.5 text-xs"
              :class="passwordChecks.number ? 'text-green-600' : 'text-gray-400'"
            >
              {{ passwordChecks.number ? '✓' : '○' }} Angka (0-9)
            </div>
            <div
              class="flex items-center gap-1.5 text-xs col-span-2"
              :class="passwordChecks.symbol ? 'text-green-600' : 'text-gray-400'"
            >
              {{ passwordChecks.symbol ? '✓' : '○' }} Simbol (!@#$%^&*)
            </div>
          </div>
        </div>
      </div>

      <!-- Input Konfirmasi -->
      <div class="mb-6">
        <label class="text-xs text-gray-500 mb-1 block">Konfirmasi Password</label>
        <input
          v-model="passwordConfirmation"
          type="password"
          placeholder="Ulangi password baru"
          class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          :class="
            passwordConfirmation && !passwordMatched ? 'border-red-300 focus:ring-red-200' : ''
          "
        />
        <p v-if="passwordConfirmation && !passwordMatched" class="text-xs text-red-500 mt-1">
          Password tidak cocok
        </p>
        <p v-if="passwordMatched" class="text-xs text-green-600 mt-1">✓ Password cocok</p>
      </div>

      <!-- Tombol -->
      <button
        @click="handleReset"
        :disabled="!canSubmit"
        class="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
      >
        <svg
          v-if="loading"
          class="animate-spin h-4 w-4"
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
          ></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        {{ loading ? 'Memproses...' : 'Reset Password' }}
      </button>

      <p class="text-center text-sm text-gray-500 mt-4">
        Kembali ke
        <router-link to="/login" class="text-blue-600 hover:underline">Login</router-link>
      </p>
    </div>
  </div>
</template>
