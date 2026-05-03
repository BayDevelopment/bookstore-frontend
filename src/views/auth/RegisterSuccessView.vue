<script setup>
import { ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

const email = ref(localStorage.getItem('temp_email') || '')

const resendEmail = async () => {
  try {
    await axios.post('http://127.0.0.1:8000/api/email/resend', {
      email: email.value,
    })

    Swal.fire('Berhasil', 'Email verifikasi dikirim ulang', 'success')
  } catch (error) {
    Swal.fire('Gagal', 'Terjadi kesalahan', 'error')
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-white">
    <div class="text-center max-w-md">
      <h1 class="text-2xl font-semibold text-gray-800 mb-2">Cek Email Kamu 📧</h1>

      <p class="text-gray-500 mb-6">Kami telah mengirim link verifikasi ke email kamu.</p>

      <button
        @click="resendEmail"
        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        Kirim Ulang Email
      </button>

      <router-link to="/login" class="block mt-4 text-blue-600"> Kembali ke Login </router-link>
    </div>
  </div>
</template>
