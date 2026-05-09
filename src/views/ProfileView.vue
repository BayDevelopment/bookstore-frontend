<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/lib/axios'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()

const user = ref(null)
const stats = ref({ total_orders: 0, total_cart: 0, total_done: 0 })
const loading = ref(true)
const loadingProfile = ref(true)
const loadingPassword = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const form = ref({ name: '', phone: '', nim: '', fakultas_id: null, prodi_id: null })
const passwordForm = ref({ current_password: '', password: '', password_confirmation: '' })

const fakultasList = ref([])
const prodiList = ref([])
const filteredProdi = ref([])
const loadingUpdate = ref(false)

const initials = computed(() => {
  if (!user.value?.name) return '??'
  return user.value.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

watch(
  () => form.value.fakultas_id,
  (val) => {
    filteredProdi.value = prodiList.value.filter((p) => p.fakultas_id == val)
    if (!loading.value) form.value.prodi_id = null
  },
)

onMounted(async () => {
  const stored = localStorage.getItem('user')
  if (stored) user.value = JSON.parse(stored)

  const cachedFakultas = localStorage.getItem('fakultas_list')
  const cachedProdi = localStorage.getItem('prodi_list')

  if (cachedFakultas) fakultasList.value = JSON.parse(cachedFakultas)
  if (cachedProdi) prodiList.value = JSON.parse(cachedProdi)

  try {
    const profileRes = await api.get('/profile')

    user.value = profileRes.data.data.user
    stats.value = profileRes.data.data.stats

    form.value.name = user.value.name
    form.value.nim = user.value.nim ?? ''
    form.value.phone = user.value.phone ?? ''
    form.value.fakultas_id = user.value.fakultas_id ?? null
    form.value.prodi_id = user.value.prodi_id ?? null

    filteredProdi.value = prodiList.value.filter((p) => p.fakultas_id == form.value.fakultas_id)

    localStorage.setItem('user', JSON.stringify(user.value))
    loadingProfile.value = false

    if (!cachedFakultas || !cachedProdi) {
      const [fakultasRes, prodiRes] = await Promise.all([api.get('/fakultas'), api.get('/prodi')])

      fakultasList.value = fakultasRes.data.data
      prodiList.value = prodiRes.data.data
      filteredProdi.value = prodiRes.data.data.filter(
        (p) => p.fakultas_id == form.value.fakultas_id,
      )

      localStorage.setItem('fakultas_list', JSON.stringify(fakultasRes.data.data))
      localStorage.setItem('prodi_list', JSON.stringify(prodiRes.data.data))
    }
  } catch (e) {
    //
  } finally {
    loading.value = false
    loadingProfile.value = false
  }
})

async function updateProfile() {
  successMsg.value = ''
  errorMsg.value = ''
  loadingUpdate.value = true
  try {
    const { data: res } = await api.put('/profile', form.value)
    user.value = res.data
    localStorage.setItem('user', JSON.stringify(res.data))
    successMsg.value = 'Profil berhasil diperbarui!'
  } catch (e) {
    errorMsg.value = e.response?.data?.message ?? 'Gagal memperbarui profil.'
  } finally {
    loadingUpdate.value = false
  }
}

async function updatePassword() {
  errorMsg.value = ''
  successMsg.value = ''
  loadingPassword.value = true
  try {
    await api.put('/profile/password', passwordForm.value)
    successMsg.value = 'Password berhasil diubah!'
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
  } catch (e) {
    const errors = e.response?.data?.errors
    if (errors?.current_password) {
      errorMsg.value = errors.current_password[0]
    } else {
      errorMsg.value = e.response?.data?.message ?? 'Gagal mengubah password.'
    }
  } finally {
    loadingPassword.value = false
  }
}

async function logoutAll() {
  const result = await Swal.fire({
    title: 'Logout Semua Perangkat?',
    text: 'Semua sesi aktif di perangkat lain akan dihentikan.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Ya, Logout Semua',
    cancelButtonText: 'Batal',
  })

  if (!result.isConfirmed) return

  try {
    await api.post('/profile/logout-all', {})
  } catch (e) {
    //
  } finally {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 relative overflow-hidden">
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

      <!-- ALERT -->
      <div
        v-if="successMsg"
        class="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3"
      >
        ✅ {{ successMsg }}
      </div>
      <div
        v-if="errorMsg"
        class="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
      >
        ❌ {{ errorMsg }}
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
            <p class="font-semibold text-gray-800">{{ user?.name ?? '...' }}</p>
            <p class="text-sm text-gray-500">{{ user?.email ?? '...' }}</p>
            <span
              class="mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700"
              >✓ Aktif</span
            >
          </div>
        </div>

        <p class="text-sm font-semibold text-gray-700 mb-4">Informasi Akun</p>

        <!-- SKELETON -->
        <div v-if="loadingProfile" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="skeleton h-3 w-20 rounded"></div>
              <div class="skeleton h-9 w-full rounded-lg"></div>
            </div>
            <div class="space-y-2">
              <div class="skeleton h-3 w-16 rounded"></div>
              <div class="skeleton h-9 w-full rounded-lg"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="skeleton h-3 w-12 rounded"></div>
              <div class="skeleton h-9 w-full rounded-lg"></div>
            </div>
            <div class="space-y-2">
              <div class="skeleton h-3 w-14 rounded"></div>
              <div class="skeleton h-9 w-full rounded-lg"></div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="skeleton h-3 w-16 rounded"></div>
              <div class="skeleton h-9 w-full rounded-lg"></div>
            </div>
            <div class="space-y-2">
              <div class="skeleton h-3 w-20 rounded"></div>
              <div class="skeleton h-9 w-full rounded-lg"></div>
            </div>
          </div>
          <div class="flex justify-end">
            <div class="skeleton h-9 w-36 rounded-xl"></div>
          </div>
        </div>

        <!-- FORM -->
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
                :value="user?.email ?? ''"
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
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
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
              class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-xl transition"
            >
              <svg
                v-if="loadingUpdate"
                class="animate-spin h-4 w-4 text-white"
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
            class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm px-5 py-2 rounded-xl transition"
          >
            <svg
              v-if="loadingPassword"
              class="animate-spin h-4 w-4 text-white"
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
            {{ loadingPassword ? 'Menyimpan...' : 'Update Password' }}
          </button>
        </div>
      </div>

      <!-- CARD: Statistik -->
      <div
        class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6 mb-5"
      >
        <p class="text-sm font-semibold text-gray-700 mb-4">Ringkasan Aktivitas</p>
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <p class="text-xl font-semibold text-gray-800">{{ stats.total_orders }}</p>
            <p class="text-xs text-gray-500 mt-1">Total Pesanan</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <p class="text-xl font-semibold text-gray-800">{{ stats.total_cart }}</p>
            <p class="text-xs text-gray-500 mt-1">Di Keranjang</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <p class="text-xl font-semibold text-gray-800">{{ stats.total_done }}</p>
            <p class="text-xs text-gray-500 mt-1">Selesai</p>
          </div>
        </div>
      </div>

      <!-- CARD: Zona Berbahaya -->
      <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
        <p class="text-sm font-semibold text-red-600 mb-4">Zona Berbahaya</p>
        <div
          class="flex items-center justify-between border border-red-100 rounded-xl p-4 bg-red-50/50"
        >
          <div>
            <p class="text-sm font-semibold text-red-700">Logout dari semua perangkat</p>
            <p class="text-xs text-gray-400 mt-0.5">Semua sesi aktif akan dihentikan</p>
          </div>
          <button
            @click="logoutAll"
            class="text-sm text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-xl transition"
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
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: bone 1.4s ease-in-out infinite;
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
