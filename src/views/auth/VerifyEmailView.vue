<script setup>
import axios from 'axios'
import Swal from 'sweetalert2'

const resendEmail = async () => {
  try {
    await axios.post('http://127.0.0.1:8000/api/email/resend', {
      email: localStorage.getItem('temp_email'),
    })

    Swal.fire('Berhasil', 'Email dikirim ulang', 'success')
  } catch {
    Swal.fire('Gagal', 'Terjadi kesalahan', 'error')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center max-w-md">
      <h2 class="text-xl font-semibold text-gray-800">Email belum diverifikasi</h2>

      <p class="text-gray-500 mt-2">Silakan cek email kamu atau kirim ulang link verifikasi</p>

      <button
        @click="resendEmail"
        class="mt-5 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Kirim Ulang
      </button>

      <router-link to="/login" class="block mt-4 text-blue-600"> Kembali ke Login </router-link>
    </div>
  </div>
</template>
