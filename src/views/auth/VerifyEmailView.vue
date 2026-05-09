<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/lib/axios'
import Swal from 'sweetalert2'

const router = useRouter()
const loading = ref(false)
const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
const email = localStorage.getItem('temp_email') || storedUser?.email || ''

const resendEmail = async () => {
  if (!email) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: 'Email tidak ditemukan. Silakan register ulang.',
      confirmButtonColor: '#2563eb',
    })
    return
  }

  loading.value = true
  try {
    await api.post('/email/resend', { email })
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: 'Email verifikasi telah dikirim ulang. Cek inbox kamu.',
      confirmButtonColor: '#2563eb',
    })
  } catch (e) {
    const msg = e.response?.data?.message ?? 'Terjadi kesalahan.'
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: msg,
      confirmButtonColor: '#2563eb',
    })
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('temp_email')
  localStorage.removeItem('fakultas_list')
  localStorage.removeItem('prodi_list')
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center"
    >
      <div class="text-4xl mb-4">📧</div>
      <h2 class="text-xl font-semibold text-gray-800">Email belum diverifikasi</h2>
      <p class="text-gray-500 text-sm mt-2">
        Silakan cek email
        <span class="font-medium text-gray-700">{{ email }}</span>
        atau kirim ulang link verifikasi
      </p>

      <button
        @click="resendEmail"
        :disabled="loading"
        class="inline-flex items-center justify-center gap-2 mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
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
        {{ loading ? 'Mengirim...' : 'Kirim Ulang' }}
      </button>

      <!-- ✅ Logout + kembali ke login -->
      <button
        @click="handleLogout"
        class="block mt-4 text-sm text-blue-600 hover:underline w-full text-center"
      >
        Kembali ke Login
      </button>
    </div>
  </div>
</template>
