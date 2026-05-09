<script setup>
import { ref, onMounted } from 'vue'
import api from '@/lib/axios'
import { useRouter } from 'vue-router'

// 1. Konstanta ditaruh di luar/atas agar lebih clean
const STATUS_MAP = {
  pending: { label: 'Menunggu Pembayaran', cls: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  confirmed: { label: 'Dikonfirmasi', cls: 'bg-green-100 text-green-700', icon: '✅' },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700', icon: '❌' },
}

const router = useRouter()
const user = ref(null)
const stats = ref({ total_books: 0, total_cart: 0, total_orders: 0 })
const recentOrders = ref([])
const loading = ref(true)

// 2. Helper Functions
function getStatus(s) {
  return STATUS_MAP[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600', icon: '📦' }
}

function coverSrc(cover) {
  if (!cover) return null
  if (cover.startsWith('http')) return cover

  // Mengambil base URL dari .env
  const storageBase = import.meta.env.VITE_STORAGE_URL
  return `${storageBase}/${cover}`
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// 3. Lifecycle
onMounted(async () => {
  // Ambil data user dengan proteksi try-catch
  const data = localStorage.getItem('user')
  if (data) {
    try {
      user.value = JSON.parse(data)
    } catch {
      console.error('Gagal parse data user')
    }
  }

  try {
    const { data: res } = await api.get('/dashboard')
    // Asumsi API mengembalikan { data: { total_books, recent_orders, ... } }
    stats.value = res.data
    recentOrders.value = res.data.recent_orders ?? []
  } catch (e) {
    console.error('Gagal mengambil data dashboard:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 relative overflow-hidden">
    <!-- BACKGROUND DECORATION -->
    <div class="absolute inset-0 pointer-events-none">
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
      <div class="absolute inset-0 flex justify-center items-center">
        <div class="w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>

    <div class="relative max-w-7xl mx-auto px-6 py-10">
      <!-- HEADER -->
      <div class="mb-10">
        <h1 class="text-2xl font-semibold text-gray-800">
          Halo, {{ user?.name || 'Mahasiswa' }} 👋
        </h1>
        <p class="text-gray-500 text-sm mt-1">Selamat datang kembali di BookStore Unival</p>
      </div>

      <!-- STATS CARDS -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div
          v-for="(val, label) in {
            'Buku Tersedia': stats.total_books,
            Keranjang: stats.total_cart,
            Pesanan: stats.total_orders,
          }"
          :key="label"
          class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100"
        >
          <p class="text-sm text-gray-500">{{ label }}</p>
          <h2 class="text-xl font-semibold text-gray-800 mt-1">
            {{ loading ? '...' : val }}
          </h2>
        </div>
        <div class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">Status Akun</p>
          <h2 class="text-green-600 font-semibold mt-1">Aktif ✓</h2>
        </div>
      </div>

      <!-- QUICK ACTIONS -->
      <div class="grid md:grid-cols-3 gap-6 mb-10">
        <router-link
          to="/books"
          class="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition"
        >
          <div class="text-3xl mb-3">📚</div>
          <h3 class="font-semibold text-gray-800 group-hover:text-blue-600">Jelajahi Buku</h3>
          <p class="text-sm text-gray-500 mt-1">Cari buku untuk kebutuhan kuliahmu</p>
        </router-link>

        <router-link
          to="/keranjang"
          class="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition"
        >
          <div class="text-3xl mb-3">🛒</div>
          <h3 class="font-semibold text-gray-800 group-hover:text-blue-600">Keranjang</h3>
          <p class="text-sm text-gray-500 mt-1">Lihat buku yang sudah kamu pilih</p>
        </router-link>

        <router-link
          to="/orders"
          class="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition"
        >
          <div class="text-3xl mb-3">📦</div>
          <h3 class="font-semibold text-gray-800 group-hover:text-blue-600">Pesanan Saya</h3>
          <p class="text-sm text-gray-500 mt-1">Cek status dan riwayat pesananmu</p>
        </router-link>
      </div>

      <!-- RECENT ACTIVITY -->
      <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="font-semibold text-gray-800">Aktivitas Terakhir</h3>
          <router-link to="/orders" class="text-xs text-blue-600 hover:underline">
            Lihat semua →
          </router-link>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading" class="space-y-4">
          <div v-for="i in 3" :key="i" class="flex gap-4 items-center">
            <div class="skeleton w-10 h-14 rounded-lg shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton h-3 rounded w-1/2"></div>
              <div class="skeleton h-3 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-else-if="recentOrders.length === 0"
          class="flex flex-col items-center py-10 text-center"
        >
          <p class="text-3xl mb-2">🛒</p>
          <p class="text-sm text-gray-500">Belum ada aktivitas pesanan.</p>
          <router-link to="/books" class="mt-3 text-sm text-blue-600 hover:underline">
            Mulai beli buku →
          </router-link>
        </div>

        <!-- Order List -->
        <div v-else class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            @click="router.push(`/orders/${order.id}`)"
            class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition group border border-transparent hover:border-gray-100"
          >
            <!-- Cover -->
            <div class="shrink-0 w-10 h-14 rounded-lg overflow-hidden bg-gray-100 shadow-sm">
              <img
                v-if="coverSrc(order.book_cover)"
                :src="coverSrc(order.book_cover)"
                class="w-full h-full object-cover transition group-hover:scale-110"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-lg">📚</div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ order.book_title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(order.created_at) }}</p>
            </div>

            <!-- Status + Price -->
            <div class="text-right shrink-0">
              <span
                :class="[
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold whitespace-nowrap',
                  getStatus(order.status).cls,
                ]"
              >
                {{ getStatus(order.status).icon }} {{ getStatus(order.status).label }}
              </span>
              <p class="text-xs text-gray-600 font-medium mt-1">
                Rp {{ Number(order.total).toLocaleString('id-ID') }}
              </p>
            </div>
          </div>
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
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
