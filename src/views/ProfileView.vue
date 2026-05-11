<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/lib/axios'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()

// ✅ SAFE PARSE
const safeParse = (data, fallback = null) => {
  if (!data) return fallback
  try {
    return JSON.parse(data)
  } catch {
    return fallback
  }
}

// STATE
const user = ref(null)
const stats = ref({ total_orders: 0, total_cart: 0, total_done: 0 })

const loadingProfile = ref(true)
const loadingUpdate = ref(false)
const loadingPassword = ref(false)

const form = ref({
  name: '',
  phone: '',
  nim: '',
  fakultas_id: null,
  prodi_id: null,
})

const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const fakultasList = ref([])
const prodiList = ref([])

// COMPUTED
const initials = computed(() => {
  if (!user.value?.name) return '??'
  return user.value.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const filteredProdi = computed(() => {
  if (!form.value.fakultas_id) return []
  return prodiList.value.filter((p) => String(p.fakultas_id) === String(form.value.fakultas_id))
})

// WATCH
watch(
  () => form.value.fakultas_id,
  (newVal, oldVal) => {
    if (newVal !== oldVal) form.value.prodi_id = null
  },
)

// RETRY HELPER
const fetchWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      if (i === retries - 1) throw e
      await new Promise((r) => setTimeout(r, 800 * (i + 1)))
    }
  }
}

// INIT
onMounted(async () => {
  try {
    const cachedUser = safeParse(localStorage.getItem('user'))
    const cachedFakultas = safeParse(localStorage.getItem('fakultas_list'), [])
    const cachedProdi = safeParse(localStorage.getItem('prodi_list'), [])

    if (cachedUser) {
      user.value = cachedUser
      Object.assign(form.value, {
        name: cachedUser.name ?? '',
        nim: cachedUser.nim ?? '',
        phone: cachedUser.phone ?? '',
        fakultas_id: cachedUser.fakultas_id ?? null,
        prodi_id: cachedUser.prodi_id ?? null,
      })
    }

    fakultasList.value = cachedFakultas
    prodiList.value = cachedProdi

    if (!cachedFakultas.length || !cachedProdi.length) {
      const [resF, resP] = await Promise.all([
        fetchWithRetry(() => api.get('/fakultas')),
        fetchWithRetry(() => api.get('/prodi')),
      ])

      fakultasList.value = resF?.data?.data || []
      prodiList.value = resP?.data?.data || []

      localStorage.setItem('fakultas_list', JSON.stringify(fakultasList.value))
      localStorage.setItem('prodi_list', JSON.stringify(prodiList.value))
    }

    const { data: res } = await fetchWithRetry(() => api.get('/profile'))
    const userData = res?.data?.user

    if (userData) {
      user.value = userData
      stats.value = res?.data?.stats || stats.value

      Object.assign(form.value, {
        name: userData.name ?? '',
        nim: userData.nim ?? '',
        phone: userData.phone ?? '',
        fakultas_id: userData.fakultas_id ?? null,
        prodi_id: userData.prodi_id ?? null,
      })

      localStorage.setItem('user', JSON.stringify(userData))
    }
  } catch (e) {
    console.error('Profile error:', e)
    Swal.fire({
      icon: 'error',
      title: 'Gagal memuat profil',
      text: 'Periksa koneksi atau login ulang',
    })
  } finally {
    loadingProfile.value = false
  }
})

// ACTIONS
async function updateProfile() {
  loadingUpdate.value = true
  try {
    const { data: res } = await api.put('/profile', form.value)
    user.value = res?.data
    localStorage.setItem('user', JSON.stringify(res?.data))

    Swal.fire({
      icon: 'success',
      title: 'Berhasil',
      text: 'Profil diperbarui!',
      timer: 2000,
      showConfirmButton: false,
    })
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: e.response?.data?.message || 'Terjadi kesalahan',
    })
  } finally {
    loadingUpdate.value = false
  }
}

async function updatePassword() {
  loadingPassword.value = true
  try {
    await api.put('/profile/password', passwordForm.value)
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Password diperbarui' })
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal',
      text: e.response?.data?.message || 'Error',
    })
  } finally {
    loadingPassword.value = false
  }
}

async function logoutAll() {
  const result = await Swal.fire({
    title: 'Logout semua perangkat?',
    icon: 'warning',
    showCancelButton: true,
  })

  if (!result.isConfirmed) return

  try {
    await api.post('/profile/logout-all')
    localStorage.clear()
    router.push('/login')
  } catch {
    Swal.fire('Error', 'Gagal logout', 'error')
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen pb-20">
    <!-- Background Decor - Diperbaiki untuk mobile -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
      <div class="absolute inset-0 flex justify-center items-center">
        <div class="w-[450px] h-[450px] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <!-- GLOBAL LOADING -->
      <div v-if="loadingProfile" class="flex flex-col items-center justify-center py-32">
        <div class="animate-pulse text-gray-400">Memuat profil...</div>
      </div>

      <!-- SEMUA KONTEN -->
      <div v-else class="space-y-6">
        <!-- HEADER -->
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold text-gray-800">Profil Saya</h1>
          <p class="text-gray-500 mt-1">Kelola informasi akun dan keamananmu</p>
        </div>

        <!-- CARD: Info Akun -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
        >
          <div class="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
            <div
              class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-2xl shrink-0"
            >
              {{ initials }}
            </div>
            <div>
              <p class="font-semibold text-gray-800 text-lg">{{ user?.name ?? 'Memuat...' }}</p>
              <p class="text-sm text-gray-500">{{ user?.email }}</p>
              <span
                class="mt-1 inline-block text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700"
                >✓ Aktif</span
              >
            </div>
          </div>

          <p class="text-sm font-semibold text-gray-700 mb-4">Informasi Akun</p>

          <div class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Nama Lengkap</label>
                <input
                  v-model="form.name"
                  type="text"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">NIM</label>
                <input
                  v-model="form.nim"
                  type="text"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Email</label>
                <input
                  :value="user?.email"
                  disabled
                  class="w-full border border-gray-100 bg-gray-50 text-gray-400 rounded-xl px-4 py-3 cursor-not-allowed"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">No. HP</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Fakultas</label>
                <select
                  v-model="form.fakultas_id"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
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
                  :disabled="!form.fakultas_id"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-gray-50"
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

            <div class="flex justify-end pt-2">
              <button
                @click="updateProfile"
                :disabled="loadingUpdate"
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-xl font-medium flex items-center gap-2 transition"
              >
                <span
                  v-if="loadingUpdate"
                  class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"
                ></span>
                {{ loadingUpdate ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </div>
        </div>

        <!-- CARD: Ubah Password -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6"
        >
          <p class="text-sm font-semibold text-gray-700 mb-4">Ubah Password</p>
          <div class="space-y-5">
            <div>
              <label class="text-xs text-gray-500 mb-1 block">Password Lama</label>
              <input
                v-model="passwordForm.current_password"
                type="password"
                placeholder="••••••••"
                class="w-full border border-gray-200 rounded-xl px-4 py-3"
              />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Password Baru</label>
                <input
                  v-model="passwordForm.password"
                  type="password"
                  placeholder="Min. 8 karakter"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Konfirmasi Password</label>
                <input
                  v-model="passwordForm.password_confirmation"
                  type="password"
                  placeholder="Ulangi password baru"
                  class="w-full border border-gray-200 rounded-xl px-4 py-3"
                />
              </div>
            </div>
            <div class="flex justify-end">
              <button
                @click="updatePassword"
                :disabled="loadingPassword"
                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-xl font-medium flex items-center gap-2 transition"
              >
                <span
                  v-if="loadingPassword"
                  class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block"
                ></span>
                Update Password
              </button>
            </div>
          </div>
        </div>

        <!-- CARD: Statistik -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
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
  </div>
</template>
