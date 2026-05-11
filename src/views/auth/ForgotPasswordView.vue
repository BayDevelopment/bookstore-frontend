<script setup>
import { ref } from 'vue'
import api from '@/lib/axios'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const loading = ref(false)

const handleForgot = async () => {
  if (!email.value || loading.value) return
  loading.value = true

  try {
    await api.post('/forgot-password', { email: email.value })

    // Memberikan feedback sukses dan mengarahkan kembali ke login
    await Swal.fire({
      icon: 'success',
      title: 'Email Terkirim!',
      text: 'Cek folder inbox atau spam kamu untuk link reset password.',
      confirmButtonColor: '#2563eb',
    })

    router.push('/login')
  } catch (error) {
    if (error.response?.status === 429) {
      Swal.fire({
        icon: 'warning',
        title: 'Terlalu Banyak Percobaan',
        text: 'Sistem mendeteksi aktivitas berlebih. Coba lagi dalam beberapa menit.',
        confirmButtonColor: '#2563eb',
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: error.response?.data?.message ?? 'Terjadi kesalahan, pastikan email benar.',
        confirmButtonColor: '#2563eb',
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Menggunakan min-h-[100dvh] untuk kompatibilitas browser mobile -->
  <div
    class="flex items-center justify-center relative overflow-hidden px-6"
    style="min-height: 100dvh"
  >
    <!-- Background Decor -->
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
      class="relative w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8"
    >
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">🔑</div>
        <h1 class="text-2xl font-semibold text-gray-800">Lupa Password</h1>
        <p class="text-sm text-gray-500 mt-1">Kami akan mengirimkan link pemulihan</p>
      </div>

      <form @submit.prevent="handleForgot" class="space-y-5">
        <div>
          <label class="text-xs font-medium text-gray-600 ml-1">Email Terdaftar</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-lg group-focus-within:grayscale-0 grayscale transition"
              >📧</span
            >
            <input
              v-model="email"
              type="email"
              required
              placeholder="nama@email.com"
              autocomplete="email"
              :disabled="loading"
              class="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition disabled:opacity-50 disabled:bg-gray-100"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading || !email"
          class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span>{{ loading ? 'Mengirim Link...' : 'Kirim Link Reset' }}</span>
        </button>
      </form>

      <div class="mt-8 pt-6 border-t border-gray-100">
        <p class="text-sm text-center text-gray-500">
          Sudah ingat password?
          <router-link
            to="/login"
            class="text-blue-600 font-semibold hover:text-blue-700 transition"
          >
            Kembali Login
          </router-link>
        </p>
      </div>
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

/* Memastikan input memiliki styling yang konsisten jika class .input-modern tidak terbaca */
input::placeholder {
  color: #9ca3af;
}
</style>
