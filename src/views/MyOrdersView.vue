<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuth() // Gunakan store secara konsisten

const orders = ref([])
const loading = ref(true)
const error = ref(null)
const newOrderId = ref(route.query.new ? Number(route.query.new) : null)
const showNewOrderToast = ref(!!newOrderId.value)

// Ambil Base URL Storage dari .env
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL

async function fetchOrders() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/orders')
    // Normalisasi data: kadangkala Laravel mengembalikan data di dalam object 'data'
    orders.value = data.data || data || []
  } catch (e) {
    error.value = 'Gagal memuat daftar pesanan. Silakan coba lagi.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // Cek login via store
  if (!authStore.isLoggedIn && !localStorage.getItem('token')) {
    router.push('/login')
    return
  }

  fetchOrders()

  if (showNewOrderToast.value) {
    setTimeout(() => (showNewOrderToast.value = false), 6000)
  }
})

// Konfigurasi Status yang lebih lengkap
const STATUS_MAP = {
  pending: { label: 'Menunggu Pembayaran', cls: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  waiting: { label: 'Menunggu Verifikasi', cls: 'bg-blue-100 text-blue-700', icon: '🔍' },
  verified: { label: 'Pembayaran Diterima', cls: 'bg-green-100 text-green-700', icon: '✅' },
  rejected: { label: 'Pesanan Ditolak', cls: 'bg-red-100 text-red-700', icon: '❌' },
  completed: { label: 'Selesai', cls: 'bg-gray-100 text-gray-700', icon: '🏁' },
}

function getStatus(s) {
  return STATUS_MAP[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600', icon: '📦' }
}

function coverSrc(cover) {
  if (!cover) return null
  if (cover.startsWith('http')) return cover
  return `${STORAGE_URL}/${cover}`
}

function getBook(order) {
  // Mengambil buku pertama dari item pesanan
  return order.items?.[0]?.book ?? null
}

const isEmpty = computed(() => !loading.value && orders.value.length === 0)
</script>

<template>
  <div class="relative min-h-screen bg-gray-50/30 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <!-- TOAST: Notifikasi Pesanan Baru -->
    <Transition name="slide-down">
      <div
        v-if="showNewOrderToast"
        class="fixed top-6 left-1/2 -translate-x-1/2 z-[60] px-4 w-full max-w-sm"
      >
        <div
          class="bg-white border-l-4 border-green-500 rounded-2xl shadow-2xl px-5 py-4 flex items-start gap-4"
        >
          <div class="bg-green-100 p-2 rounded-full">🎉</div>
          <div class="flex-1">
            <p class="font-bold text-gray-900 text-sm">Pesanan Berhasil!</p>
            <p class="text-xs text-gray-500 mt-1 leading-relaxed">
              Silakan klik pesanan bertanda
              <span class="text-blue-600 font-bold uppercase">✨ Baru</span> untuk mengunggah bukti
              transfer.
            </p>
          </div>
          <button @click="showNewOrderToast = false" class="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
      </div>
    </Transition>

    <div class="relative max-w-2xl mx-auto px-6 pt-10 pb-20">
      <!-- HEADER -->
      <div class="mb-10 text-center md:text-left">
        <button
          @click="router.push('/books')"
          class="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-blue-600 transition group mb-4"
        >
          <svg
            class="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali Belanja
        </button>
        <h1 class="text-3xl font-black text-gray-900">Pesanan Saya</h1>
        <p class="text-gray-500 mt-1">Pantau status pengiriman dan pembayaran buku kamu</p>
      </div>

      <!-- SKELETON LOADING -->
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 4"
          :key="i"
          class="bg-white rounded-3xl p-5 flex gap-4 border border-gray-100"
        >
          <div class="skeleton w-16 h-24 rounded-2xl shrink-0"></div>
          <div class="flex-1 space-y-3 pt-2">
            <div class="skeleton h-5 rounded w-3/4"></div>
            <div class="skeleton h-3 rounded w-1/2"></div>
            <div class="skeleton h-8 rounded w-28 mt-4"></div>
          </div>
        </div>
      </div>

      <!-- ERROR STATE -->
      <div v-else-if="error" class="flex flex-col items-center py-20 text-center">
        <div
          class="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4"
        >
          ⚠️
        </div>
        <p class="text-gray-600 font-medium">{{ error }}</p>
        <button
          @click="fetchOrders"
          class="mt-6 px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-100"
        >
          Coba Muat Ulang
        </button>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="isEmpty" class="flex flex-col items-center py-24 text-center">
        <div class="text-7xl mb-6">📦</div>
        <h2 class="text-xl font-bold text-gray-800">Belum ada aktivitas</h2>
        <p class="text-gray-500 mt-2 max-w-xs">
          Kamu belum pernah memesan buku apapun di Unival Store.
        </p>
        <router-link
          to="/books"
          class="mt-8 px-8 py-3 bg-blue-600 text-white rounded-full font-bold shadow-xl"
        >
          Cari Buku Sekarang
        </router-link>
      </div>

      <!-- ORDERS LIST -->
      <div v-else class="space-y-5">
        <div
          v-for="order in orders"
          :key="order.id"
          @click="router.push(`/orders/${order.id}`)"
          :class="[
            'group bg-white rounded-3xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1',
            order.id === newOrderId
              ? 'border-blue-400 bg-blue-50/30 ring-4 ring-blue-50'
              : 'border-gray-100',
          ]"
        >
          <!-- New Label -->
          <div v-if="order.id === newOrderId" class="flex items-center gap-2 mb-4">
            <span
              class="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full animate-bounce"
            >
              ✨ Baru
            </span>
            <span class="text-xs font-bold text-blue-600 uppercase tracking-tighter"
              >Segera Upload Bukti Bayar</span
            >
          </div>

          <div class="flex gap-5">
            <!-- Thumbnail -->
            <div class="shrink-0 w-16 h-24 rounded-2xl overflow-hidden bg-gray-50 shadow-md">
              <img
                v-if="coverSrc(getBook(order)?.cover)"
                :src="coverSrc(getBook(order)?.cover)"
                class="w-full h-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl">📚</div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0 flex flex-col justify-between">
              <div class="flex justify-between items-start gap-2">
                <div class="min-w-0">
                  <h3
                    class="font-bold text-gray-900 text-base leading-tight truncate group-hover:text-blue-600 transition"
                  >
                    {{ getBook(order)?.title || 'Pesanan Multi-Item' }}
                  </h3>
                  <p class="text-xs text-gray-400 font-medium mt-1 uppercase">
                    {{ getBook(order)?.author || 'Bookstore Unival' }}
                  </p>
                </div>
                <!-- Status Badge -->
                <span
                  :class="[
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight',
                    getStatus(order.status).cls,
                  ]"
                >
                  {{ getStatus(order.status).icon }} {{ getStatus(order.status).label }}
                </span>
              </div>

              <div class="mt-4 flex items-end justify-between border-t border-gray-50 pt-4">
                <div>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Invoice
                  </p>
                  <p class="text-xs font-mono font-bold text-blue-600">
                    {{ order.order_code || `#INV-${order.id}` }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Total Tagihan
                  </p>
                  <p class="text-base font-black text-gray-900">
                    Rp {{ Number(order.total).toLocaleString('id-ID') }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-bg {
  background-image: radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.05) 1px, transparent 0);
  background-size: 32px 32px;
}

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

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -40px);
}
</style>
