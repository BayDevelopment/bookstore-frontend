<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/lib/axios'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()

// State Data
const user = ref(null)
const stats = ref({ total_orders: 0, total_cart: 0, total_done: 0 })
const loadingProfile = ref(true)
const loadingUpdate = ref(false)
const loadingPassword = ref(false)

// State Form
const form = ref({ name: '', phone: '', nim: '', fakultas_id: null, prodi_id: null })
const passwordForm = ref({ current_password: '', password: '', password_confirmation: '' })

// State Master Data
const fakultasList = ref([])
const prodiList = ref([])

// Computed: Inisial Nama
const initials = computed(() => {
  if (!user.value?.name) return '??'
  return user.value.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

// Computed: Filter prodi berdasarkan fakultas_id yang dipilih di form
const filteredProdi = computed(() => {
  if (!form.value.fakultas_id) return []
  return prodiList.value.filter((p) => p.fakultas_id == form.value.fakultas_id)
})

// Watcher: Reset prodi jika fakultas diubah oleh user
watch(
  () => form.value.fakultas_id,
  (newVal, oldVal) => {
    if (oldVal !== null && !loadingProfile.value) {
      form.value.prodi_id = null
    }
  },
)

onMounted(async () => {
  // 1. Load dari cache agar UI tidak blank
  const storedUser = localStorage.getItem('user')
  if (storedUser) user.value = JSON.parse(storedUser)

  fakultasList.value = JSON.parse(localStorage.getItem('fakultas_list') || '[]')
  prodiList.value = JSON.parse(localStorage.getItem('prodi_list') || '[]')

  try {
    // 2. Ambil master data jika cache kosong
    if (fakultasList.value.length === 0 || prodiList.value.length === 0) {
      const [resF, resP] = await Promise.all([api.get('/fakultas'), api.get('/prodi')])
      fakultasList.value = resF.data.data
      prodiList.value = resP.data.data
      localStorage.setItem('fakultas_list', JSON.stringify(fakultasList.value))
      localStorage.setItem('prodi_list', JSON.stringify(prodiList.value))
    }

    // 3. Ambil data profil terbaru dari server
    const { data: res } = await api.get('/profile')
    const userData = res.data.user
    user.value = userData
    stats.value = res.data.stats

    // Map data ke form
    form.value = {
      name: userData.name,
      nim: userData.nim ?? '',
      phone: userData.phone ?? '',
      fakultas_id: userData.fakultas_id,
      prodi_id: userData.prodi_id,
    }

    localStorage.setItem('user', JSON.stringify(userData))
  } catch {
    console.error('Gagal sinkronisasi data profil')
  } finally {
    loadingProfile.value = false
  }
})

async function updateProfile() {
  loadingUpdate.value = true
  try {
    const { data: res } = await api.put('/profile', form.value)
    user.value = res.data
    localStorage.setItem('user', JSON.stringify(res.data))
    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Profil Anda telah diperbarui!',
      timer: 2000,
      showConfirmButton: false,
    })
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Update Gagal',
      text: e.response?.data?.message || 'Terjadi kesalahan sistem.',
    })
  } finally {
    loadingUpdate.value = false
  }
}

async function updatePassword() {
  loadingPassword.value = true
  try {
    await api.put('/profile/password', passwordForm.value)
    Swal.fire({
      icon: 'success',
      title: 'Password Diubah',
      text: 'Silahkan gunakan password baru Anda.',
    })
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (e) {
    const msg = e.response?.data?.errors?.current_password?.[0] || e.response?.data?.message
    Swal.fire({
      icon: 'error',
      title: 'Gagal Ubah Password',
      text: msg || 'Pastikan password lama benar.',
    })
  } finally {
    loadingPassword.value = false
  }
}

async function logoutAll() {
  const result = await Swal.fire({
    title: 'Logout Semua Sesi?',
    text: 'Semua perangkat yang terhubung akan dipaksa keluar.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Logout Semua',
    confirmButtonColor: '#dc2626',
    cancelButtonText: 'Batal',
  })

  if (!result.isConfirmed) return

  try {
    await api.post('/profile/logout-all')
    localStorage.clear()
    router.push('/login')
  } catch {
    Swal.fire('Error', 'Gagal memproses permintaan logout.', 'error')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 relative overflow-hidden">
    <!-- Background Decor -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
      <div class="absolute inset-0 flex justify-center items-center">
        <div class="w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>

    <div class="relative max-w-2xl mx-auto px-6 py-10">
      <!-- HEADER -->
      <div class="mb-8">
        <h1 class="text-2xl font-semibold text-gray-800">Profil Saya</h1>
        <p class="text-gray-500 text-sm mt-1">Kelola informasi akun dan keamananmu</p>
      </div>

      <!-- CARD: Info Akun -->
      <div
        class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 mb-5"
      >
        <!-- Avatar Row -->
        <div class="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
          <div
            class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xl shrink-0"
          >
            {{ initials }}
          </div>
          <div>
            <p class="font-semibold text-gray-800">{{ user?.name ?? 'Memuat...' }}</p>
            <p class="text-sm text-gray-500">{{ user?.email ?? '...' }}</p>
            <span
              class="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"
              >✓ Aktif</span
            >
          </div>
        </div>

        <p class="text-sm font-semibold text-gray-700 mb-4">Informasi Akun</p>

        <!-- SKELETON LOADING -->
        <div v-if="loadingProfile" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div v-for="i in 6" :key="i" class="space-y-2">
              <div class="skeleton h-3 w-16 rounded"></div>
              <div class="skeleton h-9 w-full rounded-lg"></div>
            </div>
          </div>
        </div>

        <!-- FORM PROFILE -->
        <div v-else>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Nama Lengkap</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">NIM</label>
              <input
                v-model="form.nim"
                type="text"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                :value="user?.email"
                disabled
                type="email"
                class="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">No. HP</label>
              <input
                v-model="form.phone"
                type="text"
                placeholder="08xxxxxxxxxx"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Fakultas</label>
              <select
                v-model="form.fakultas_id"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option :value="null" disabled>-- Pilih Fakultas --</option>
                <option v-for="f in fakultasList" :key="f.id" :value="f.id">
                  {{ f.nama_fakultas }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Program Studi</label>
              <select
                v-model="form.prodi_id"
                :disabled="!form.fakultas_id || filteredProdi.length === 0"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-gray-50"
              >
                <option :value="null" disabled>
                  {{ !form.fakultas_id ? '-- Pilih fakultas dulu --' : '-- Pilih Prodi --' }}
                </option>
                <option v-for="p in filteredProdi" :key="p.id" :value="p.id">
                  {{ p.nama_prodi }}
                </option>
              </select>
            </div>
          </div>
          <div class="flex justify-end">
            <button
              @click="updateProfile"
              :disabled="loadingUpdate"
              class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-xl transition shadow-md shadow-blue-200"
            >
              <svg v-if="loadingUpdate" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              {{ loadingUpdate ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </div>
      </div>

      <!-- CARD: Ubah Password -->
      <div
        class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 mb-5"
      >
        <p class="text-sm font-semibold text-gray-700 mb-4">Ubah Password</p>
        <div class="mb-4">
          <label class="text-xs text-gray-500 mb-1 block">Password Lama</label>
          <input
            v-model="passwordForm.current_password"
            type="password"
            placeholder="••••••••"
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div class="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Password Baru</label>
            <input
              v-model="passwordForm.password"
              type="password"
              placeholder="Min. 8 karakter"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label class="text-xs text-gray-500 mb-1 block">Konfirmasi Password</label>
            <input
              v-model="passwordForm.password_confirmation"
              type="password"
              placeholder="Ulangi password baru"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        <div class="flex justify-end">
          <button
            @click="updatePassword"
            :disabled="loadingPassword"
            class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-xl transition shadow-md shadow-blue-200"
          >
            <svg v-if="loadingPassword" class="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
            Update Password
          </button>
        </div>
      </div>

      <!-- CARD: Statistik -->
      <div
        class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 mb-5"
      >
        <p class="text-sm font-semibold text-gray-700 mb-4">Ringkasan Aktivitas</p>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-center">
            <p class="text-xl font-bold text-gray-800">{{ stats.total_orders }}</p>
            <p class="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Total Pesanan</p>
          </div>
          <div class="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-center">
            <p class="text-xl font-bold text-gray-800">{{ stats.total_cart }}</p>
            <p class="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Keranjang</p>
          </div>
          <div class="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-center">
            <p class="text-xl font-bold text-gray-800">{{ stats.total_done }}</p>
            <p class="text-[10px] uppercase tracking-wider text-gray-500 mt-1">Selesai</p>
          </div>
        </div>
      </div>

      <!-- CARD: Zona Berbahaya -->
      <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
        <p class="text-sm font-semibold text-red-600 mb-4">Zona Keamanan</p>
        <div
          class="flex items-center justify-between border border-red-100 rounded-xl p-4 bg-red-50/30"
        >
          <div>
            <p class="text-sm font-semibold text-red-700">Logout Semua Perangkat</p>
            <p class="text-xs text-red-500/70 mt-0.5">
              Hentikan semua sesi aktif selain perangkat ini.
            </p>
          </div>
          <button
            @click="logoutAll"
            class="text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition shadow-sm"
          >
            Logout Semua
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: bone 1.5s infinite linear;
}
@keyframes bone {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
