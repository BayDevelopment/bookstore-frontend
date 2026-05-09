<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const { isLoggedIn } = useAuth()

const orders = ref([])
const loading = ref(true)
const error = ref(null)
const newOrderId = ref(route.query.new ? Number(route.query.new) : null)
const showNewOrderToast = ref(!!newOrderId.value)

const token = localStorage.getItem('token')

async function fetchOrders() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/orders')
    orders.value = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
  } catch (e) {
    error.value = 'Gagal memuat pesanan.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!token) {
    router.push('/login')
    return
  }
  fetchOrders()
  if (showNewOrderToast.value) {
    setTimeout(() => (showNewOrderToast.value = false), 5000)
  }
})

const statusMap = {
  pending: { label: 'Menunggu Pembayaran', cls: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  waiting: { label: 'Sedang Ditinjau', cls: 'bg-blue-100 text-blue-700', icon: '🔍' },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700', icon: '❌' },
  verified: { label: 'Diverifikasi', cls: 'bg-green-100 text-green-700', icon: '✅' },
}

function getStatus(s) {
  return statusMap[s] ?? { label: s, cls: 'bg-gray-100 text-gray-600', icon: '📦' }
}

function coverSrc(cover) {
  if (!cover) return null
  return cover.startsWith('http') ? cover : `/storage/${cover}`
}

function getBook(order) {
  return order.items?.[0]?.book ?? null
}

const isEmpty = computed(() => !loading.value && orders.value.length === 0)
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <!-- TOAST: Pesanan Baru Berhasil -->
    <Transition name="slide-down">
      <div
        v-if="showNewOrderToast"
        class="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-sm"
      >
        <div
          class="bg-white border border-green-200 rounded-2xl shadow-lg px-5 py-4 flex items-start gap-3"
        >
          <span class="text-xl mt-0.5">🎉</span>
          <div class="flex-1">
            <p class="font-bold text-gray-800 text-sm">Pesanan berhasil dibuat!</p>
            <p class="text-xs text-gray-500 mt-0.5">
              Klik <span class="font-semibold text-blue-600">Detail Pesanan</span> untuk upload
              bukti pembayaran.
            </p>
          </div>
          <button
            @click="showNewOrderToast = false"
            class="text-gray-300 hover:text-gray-500 transition text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </Transition>

    <div class="relative max-w-3xl mx-auto px-6 pt-8 pb-16">
      <!-- HEADER -->
      <div class="mb-8">
        <button
          @click="router.push('/books')"
          class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition group mb-4"
        >
          <svg
            class="w-4 h-4 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Kembali ke Daftar Buku
        </button>
        <h1 class="text-2xl font-bold text-gray-900">📦 Pesanan Saya</h1>
        <p class="text-sm text-gray-500 mt-1">Riwayat semua pemesanan buku kamu</p>
      </div>

      <!-- SKELETON -->
      <div v-if="loading" class="space-y-4">
        <div
          v-for="i in 3"
          :key="i"
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5"
        >
          <div class="flex gap-4">
            <div class="skeleton w-14 h-20 rounded-xl shrink-0"></div>
            <div class="flex-1 space-y-2 pt-1">
              <div class="skeleton h-4 rounded w-3/4"></div>
              <div class="skeleton h-3 rounded w-1/2"></div>
              <div class="skeleton h-6 rounded w-24 mt-3"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="flex flex-col items-center py-24 text-center">
        <p class="text-4xl mb-3">⚠️</p>
        <p class="text-gray-600">{{ error }}</p>
        <button
          @click="fetchOrders"
          class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
        >
          Coba Lagi
        </button>
      </div>

      <!-- EMPTY -->
      <div v-else-if="isEmpty" class="flex flex-col items-center py-24 text-center">
        <p class="text-5xl mb-4">🛒</p>
        <h2 class="text-lg font-semibold text-gray-700 mb-1">Belum ada pesanan</h2>
        <p class="text-sm text-gray-400 mb-6">Yuk mulai beli buku favoritmu!</p>
        <button
          @click="router.push('/books')"
          class="px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-700 transition"
        >
          Jelajahi Buku
        </button>
      </div>

      <!-- LIST PESANAN -->
      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.id"
          @click="router.push(`/orders/${order.id}`)"
          :class="[
            'bg-white/80 backdrop-blur-md rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group',
            order.id === newOrderId ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100',
          ]"
        >
          <!-- Badge "Baru" untuk pesanan yang baru dibuat -->
          <div v-if="order.id === newOrderId" class="flex items-center gap-2 mb-3">
            <span
              class="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full animate-pulse"
              >✨ Pesanan Baru</span
            >
            <span class="text-xs text-blue-500">Upload bukti pembayaran sekarang</span>
          </div>

          <div class="flex gap-4 items-start">
            <!-- Cover mini -->
            <div class="shrink-0 w-14 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
              <img
                v-if="coverSrc(getBook(order)?.cover)"
                :src="coverSrc(getBook(order)?.cover)"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-2xl">📚</div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-semibold text-gray-800 text-sm truncate">
                    {{ getBook(order)?.title ?? 'Judul Buku' }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5">{{ getBook(order)?.author }}</p>
                </div>
                <span
                  :class="[
                    'shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                    getStatus(order.status).cls,
                  ]"
                >
                  {{ getStatus(order.status).icon }} {{ getStatus(order.status).label }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between">
                <div>
                  <p class="text-xs text-gray-400">Kode Pesanan</p>
                  <p class="text-xs font-mono font-bold text-blue-600">
                    {{ order.order_code ?? `#${order.id}` }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-xs text-gray-400">Total</p>
                  <p class="text-sm font-bold text-gray-800">
                    Rp {{ Number(order.total ?? 0).toLocaleString('id-ID') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <p class="text-xs text-gray-400">
              {{
                order.created_at
                  ? new Date(order.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'
              }}
            </p>
            <span
              class="text-xs text-blue-600 font-medium group-hover:underline flex items-center gap-1"
            >
              {{ order.id === newOrderId ? 'Upload Bukti →' : 'Lihat Detail' }}
              <svg
                class="w-3 h-3"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-bg {
  background:
    linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}
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
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
