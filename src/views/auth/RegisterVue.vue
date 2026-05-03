<script setup>
import { ref, reactive, computed } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'

const loading = ref(false)
const router = useRouter()

const form = reactive({
  nim: '',
  name: '',
  email: '',
  fakultas: '',
  prodi: '',
  password: '',
  password_confirmation: '',
})

const errors = reactive({})

// Data Fakultas & Prodi — sesuaikan dengan Univ Alkhairiyah
const fakultasList = ['Teknik', 'Hukum', 'Ekonomi', 'FKIP', 'Kesehatan', 'Pertanian']

const prodiList = {
  Teknik: ['Teknik Informatika', 'Teknik Sipil', 'Teknik Elektro'],
  Hukum: ['Ilmu Hukum'],
  Ekonomi: ['Manajemen', 'Akuntansi'],
  FKIP: ['Pendidikan Matematika', 'Pendidikan Bahasa Indonesia'],
  Kesehatan: ['Keperawatan', 'Kebidanan'],
  Pertanian: ['Agroteknologi'],
}

const prodiTersedia = computed(() => prodiList[form.fakultas] || [])

const onFakultasChange = () => {
  form.prodi = ''
}

const clearErrors = () => {
  Object.keys(errors).forEach((k) => delete errors[k])
}

const validate = () => {
  clearErrors()
  let valid = true

  if (!form.nim || !/^[0-9]{8,20}$/.test(form.nim)) {
    errors.nim = 'NIM harus angka, minimal 8 digit'
    valid = false
  }
  if (!form.name || form.name.length < 3 || form.name.length > 100) {
    errors.name = 'Nama minimal 3 karakter dan maksimal 100 karakter'
    valid = false
  } else if (!/^[\p{L}\s]+$/u.test(form.name)) {
    errors.name = 'Nama hanya boleh berisi huruf dan spasi'
    valid = false
  }
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email tidak valid'
    valid = false
  }
  if (!form.fakultas) {
    errors.fakultas = 'Fakultas wajib dipilih'
    valid = false
  }
  if (!form.prodi) {
    errors.prodi = 'Program studi wajib dipilih'
    valid = false
  }
  if (!form.password || form.password.length < 8) {
    errors.password = 'Password minimal 8 karakter'
    valid = false
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(form.password)) {
    errors.password = 'Harus ada huruf besar, huruf kecil, angka & simbol (!@#$%^&*)'
    valid = false
  }
  if (!form.password_confirmation) {
    errors.password_confirmation = 'Konfirmasi password wajib diisi'
    valid = false
  } else if (form.password !== form.password_confirmation) {
    errors.password_confirmation = 'Konfirmasi password tidak cocok'
    valid = false
  }

  return valid
}

const handleRegister = async () => {
  if (!validate()) return

  loading.value = true

  try {
    await axios.post('http://127.0.0.1:8000/api/register', {
      nim: form.nim,
      name: form.name,
      email: form.email,
      fakultas: form.fakultas,
      prodi: form.prodi,
      password: form.password,
      password_confirmation: form.password_confirmation,
    })

    await Swal.fire({
      icon: 'success',
      title: 'Registrasi Berhasil! 🎉',
      text: 'Akun kamu sudah dibuat, silakan login.',
      confirmButtonColor: '#2563eb',
    })

    router.push('/login')
  } catch (error) {
    // Tangkap error validasi dari Laravel (422)
    if (error.response?.status === 422) {
      const serverErrors = error.response.data.errors
      Object.keys(serverErrors).forEach((key) => {
        errors[key] = serverErrors[key][0]
      })
    } else if (error.response?.status === 429) {
      Swal.fire({
        icon: 'warning',
        title: 'Terlalu Banyak Percobaan',
        text: 'Silakan coba beberapa menit lagi.',
        confirmButtonColor: '#2563eb',
      })
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mendaftar',
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
  <div class="min-h-screen flex items-center justify-center bg-white relative overflow-hidden px-6">
    <!-- Background -->
    <div class="absolute inset-0 pointer-events-none">
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
      class="relative w-full max-w-3xl bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8"
    >
      <!-- Header -->
      <div class="text-center mb-6">
        <div class="text-4xl mb-2">📚</div>
        <h1 class="text-2xl font-semibold text-gray-800">Buat Akun</h1>
        <p class="text-sm text-gray-400">Daftar untuk mulai menggunakan Bookstore Alkhairiyah</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleRegister" class="grid md:grid-cols-2 gap-5">
        <!-- NIM -->
        <div>
          <label class="text-sm text-gray-600">NIM</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >🆔</span
            >
            <input
              v-model="form.nim"
              type="text"
              placeholder="NIM (angka saja)"
              maxlength="20"
              class="input-modern pl-10"
            />
          </div>
          <p v-if="errors.nim" class="text-xs text-red-500 mt-1">{{ errors.nim }}</p>
        </div>

        <!-- Nama -->
        <div>
          <label class="text-sm text-gray-600">Nama Lengkap</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >👤</span
            >
            <input
              v-model="form.name"
              type="text"
              placeholder="Nama lengkap"
              maxlength="100"
              class="input-modern pl-10"
            />
          </div>
          <p v-if="errors.name" class="text-xs text-red-500 mt-1">{{ errors.name }}</p>
        </div>

        <!-- Email -->
        <div class="md:col-span-2">
          <label class="text-sm text-gray-600">Email</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >📧</span
            >
            <input
              v-model="form.email"
              type="email"
              placeholder="Email aktif"
              maxlength="255"
              class="input-modern pl-10"
            />
          </div>
          <p v-if="errors.email" class="text-xs text-red-500 mt-1">{{ errors.email }}</p>
        </div>

        <!-- Fakultas -->
        <div>
          <label class="text-sm text-gray-600">Fakultas</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >🏫</span
            >
            <select v-model="form.fakultas" @change="onFakultasChange" class="input-modern pl-10">
              <option value="" disabled>Pilih Fakultas</option>
              <option v-for="f in fakultasList" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <p v-if="errors.fakultas" class="text-xs text-red-500 mt-1">{{ errors.fakultas }}</p>
        </div>

        <!-- Prodi -->
        <div>
          <label class="text-sm text-gray-600">Program Studi</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >📖</span
            >
            <select
              v-model="form.prodi"
              :disabled="!form.fakultas"
              class="input-modern pl-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>Pilih Program Studi</option>
              <option v-for="p in prodiTersedia" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <p v-if="errors.prodi" class="text-xs text-red-500 mt-1">{{ errors.prodi }}</p>
        </div>

        <!-- Password -->
        <div>
          <label class="text-sm text-gray-600">Password</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >🔒</span
            >
            <input
              v-model="form.password"
              type="password"
              placeholder="Min 8 karakter"
              maxlength="255"
              class="input-modern pl-10"
            />
          </div>
          <p class="text-xs text-gray-400 mt-1">Huruf besar, huruf kecil, angka & simbol</p>
          <p v-if="errors.password" class="text-xs text-red-500 mt-1">{{ errors.password }}</p>
        </div>

        <!-- Konfirmasi Password -->
        <div>
          <label class="text-sm text-gray-600">Konfirmasi Password</label>
          <div class="relative group mt-1">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition"
              >🔐</span
            >
            <input
              v-model="form.password_confirmation"
              type="password"
              placeholder="Ulangi password"
              maxlength="255"
              class="input-modern pl-10"
            />
          </div>
          <p v-if="errors.password_confirmation" class="text-xs text-red-500 mt-1">
            {{ errors.password_confirmation }}
          </p>
        </div>

        <!-- Button -->
        <div class="md:col-span-2 mt-2">
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Mendaftar...' : 'Daftar Sekarang' }}
          </button>
        </div>
      </form>

      <!-- Footer -->
      <p class="text-center text-sm text-gray-400 mt-6">
        Sudah punya akun?
        <router-link to="/login" class="text-blue-600 hover:underline">Login</router-link>
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
