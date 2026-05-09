<script setup>
import { ref, onUnmounted } from 'vue'
import api from '@/lib/axios' // ✅ [FIX] pakai axios instance, bukan hardcode URL
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

const router = useRouter()

// ✅ [FIX] Baca email dari localStorage
const email = ref(localStorage.getItem('temp_email') || '')
const loading = ref(false) // ✅ [FIX] loading state untuk cegah spam klik

// ✅ [FIX] Bersihkan temp_email dari localStorage saat component di-unmount
onUnmounted(() => {
  localStorage.removeItem('temp_email')
})

const resendEmail = async () => {
  if (loading.value) return // ✅ guard double klik
  if (!email.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Email Tidak Ditemukan',
      text: 'Silakan kembali ke halaman registrasi.',
      confirmButtonColor: '#2563eb',
    })
    return
  }

  loading.value = true
  try {
    await api.post('/email/resend', { email: email.value })
    Swal.fire({
      icon: 'success',
      title: 'Email Terkirim!',
      text: 'Silakan cek inbox atau folder spam kamu.',
      confirmButtonColor: '#2563eb',
    })
  } catch (error) {
    // ✅ [FIX] Handle status 400 (email sudah aktif) seperti di Login.vue
    if (error.response?.status === 400) {
      Swal.fire({
        icon: 'info',
        title: 'Email Sudah Aktif',
        text: 'Akun kamu sudah aktif, silakan login.',
        confirmButtonColor: '#2563eb',
      }).then(() => router.push('/login'))
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
        title: 'Gagal Mengirim',
        text: error.response?.data?.message || 'Terjadi kesalahan, coba lagi.',
        confirmButtonColor: '#2563eb',
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative overflow-hidden px-6">
    <!-- Background — konsisten dengan Login & Register -->
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
    <div
      class="relative w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
    >
      <div class="text-5xl mb-4">📧</div>
      <h1 class="text-2xl font-semibold text-gray-800 mb-2">Cek Email Kamu</h1>
      <p class="text-gray-500 text-sm mb-2">Kami telah mengirim link verifikasi ke:</p>
      <!-- ✅ Tampilkan email tujuan -->
      <p v-if="email" class="text-blue-600 font-medium text-sm mb-6 break-all">{{ email }}</p>
      <p v-else class="text-gray-400 text-sm mb-6">Email tidak ditemukan.</p>

      <p class="text-xs text-gray-400 mb-6">
        Tidak menemukan email? Cek folder <strong>spam</strong> atau kirim ulang di bawah.
      </p>

      <!-- Tombol Kirim Ulang -->
      <button
        type="button"
        @click="resendEmail"
        :disabled="loading"
        class="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
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
        {{ loading ? 'Mengirim...' : '🔁 Kirim Ulang Email' }}
      </button>

      <router-link to="/login" class="block text-sm text-blue-600 hover:underline mt-2">
        ← Kembali ke Login
      </router-link>
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
