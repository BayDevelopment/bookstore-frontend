<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import { useAuth } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuth()

const orders = ref([])
const loading = ref(true)
const error = ref(null)
const newOrderId = ref(route.query.new ? Number(route.query.new) : null)
const showNewOrderToast = ref(!!newOrderId.value)

const STORAGE_URL = import.meta.env.VITE_STORAGE_URL

async function fetchOrders() {
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get('/orders')
    orders.value = data.data || data || []
  } catch (e) {
    error.value = 'Gagal memuat daftar pesanan. Silakan coba lagi.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!authStore.isLoggedIn && !localStorage.getItem('token')) {
    router.push('/login')
    return
  }
  fetchOrders()
  if (showNewOrderToast.value) {
    setTimeout(() => (showNewOrderToast.value = false), 6000)
  }
})

const STATUS_MAP = {
  pending: {
    label: 'Menunggu Pembayaran',
    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: '⏳',
    step: 1,
    action: 'upload',
    btnText: 'Upload Bukti',
    btnCls: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  waiting: {
    label: 'Menunggu Verifikasi',
    cls: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '🔍',
    step: 2,
    action: 'detail',
    btnText: 'Lihat Detail',
    btnCls: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  verified: {
    label: 'Pembayaran Diterima',
    cls: 'bg-green-100 text-green-700 border-green-200',
    icon: '✅',
    step: 3,
    action: 'detail',
    btnText: 'Lihat Detail',
    btnCls: 'bg-green-600 hover:bg-green-700 text-white',
  },
  rejected: {
    label: 'Perlu Upload Ulang',
    cls: 'bg-red-100 text-red-700 border-red-200',
    icon: '❌',
    step: 1,
    action: 'upload',
    btnText: 'Upload Ulang',
    btnCls: 'bg-red-500 hover:bg-red-600 text-white',
  },
  completed: {
    label: 'Selesai',
    cls: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: '🏁',
    step: 3,
    action: 'detail',
    btnText: 'Lihat Detail',
    btnCls: 'bg-gray-600 hover:bg-gray-700 text-white',
  },
  cancelled: {
    label: 'Dibatalkan',
    cls: 'bg-gray-100 text-gray-500 border-gray-200',
    icon: '🚫',
    step: 0,
    action: 'detail',
    btnText: 'Lihat Detail',
    btnCls: 'bg-gray-400 hover:bg-gray-500 text-white',
  },
}

const FALLBACK_STATUS = {
  cls: 'bg-gray-100 text-gray-600 border-gray-200',
  icon: '📦',
  step: 1,
  action: 'detail',
  btnText: 'Lihat Detail',
  btnCls: 'bg-blue-600 hover:bg-blue-700 text-white',
}

function getStatus(order) {
  if (order.payment_method?.code === 'cash') {
    return STATUS_MAP[order.status] ?? { label: order.status, ...FALLBACK_STATUS }
  }

  if (order.proof_status === 'not_uploaded') return STATUS_MAP['pending']
  if (order.proof_status === 'uploaded') return STATUS_MAP['waiting']
  if (order.proof_status === 'verified') return STATUS_MAP['verified']
  if (order.proof_status === 'invalid') return STATUS_MAP['rejected']

  return STATUS_MAP[order.status] ?? { label: order.status, ...FALLBACK_STATUS }
}

function needsUpload(order) {
  if (order.payment_method?.code === 'cash') return false
  return order.proof_status === 'not_uploaded' || order.proof_status === 'invalid'
}

function coverSrc(cover) {
  if (!cover) return null
  if (cover.startsWith('http')) return cover
  return `${STORAGE_URL}/${cover}`
}

function getBook(order) {
  return order.items?.[0]?.book ?? null
}

function getItemCount(order) {
  return order.items?.length ?? 0
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function handleCardClick(order) {
  router.push(`/orders/${order.id}`)
}

function handleActionClick(order, event) {
  event.stopPropagation()
  const status = getStatus(order)
  if (status.action === 'upload') {
    router.push(`/orders/${order.id}?tab=upload`)
  } else {
    router.push(`/orders/${order.id}`)
  }
}

const isEmpty = computed(() => !loading.value && orders.value.length === 0)
</script>

<template>
  <div class="relative min-h-screen bg-gray-50/30 overflow-hidden">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

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
              Silakan klik tombol
              <span class="text-yellow-600 font-bold">"Upload Bukti"</span> untuk mengunggah bukti
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

      <div v-else class="space-y-5">
        <div
          v-for="order in orders"
          :key="order.id"
          @click="handleCardClick(order)"
          :class="[
            'group bg-white rounded-3xl border p-5 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1',
            order.id === newOrderId
              ? 'border-blue-400 bg-blue-50/30 ring-4 ring-blue-50'
              : 'border-gray-100',
          ]"
        >
          <div v-if="order.id === newOrderId" class="flex items-center gap-2 mb-3">
            <span
              class="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase rounded-full animate-bounce"
            >
              ✨ Baru
            </span>
            <span class="text-xs font-bold text-blue-600 uppercase tracking-tighter"
              >Segera Upload Bukti Bayar</span
            >
          </div>

          <!-- MINI STEPPER — ✅ pakai getStatus(order) -->
          <div class="flex items-center gap-1 mb-4 px-1">
            <div
              v-for="step in 3"
              :key="step"
              :class="[
                'h-1.5 flex-1 rounded-full transition-all',
                step <= getStatus(order).step ? 'bg-blue-500' : 'bg-gray-200',
              ]"
            ></div>
          </div>

          <div class="flex gap-5">
            <div
              class="shrink-0 w-16 h-24 rounded-2xl overflow-hidden bg-gray-50 shadow-md relative"
            >
              <img
                v-if="coverSrc(getBook(order)?.cover)"
                :src="coverSrc(getBook(order)?.cover)"
                class="w-full h-full object-cover transition duration-500 group-hover:scale-110"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-3xl">📚</div>
              <div
                v-if="getItemCount(order) > 1"
                class="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
              >
                +{{ getItemCount(order) - 1 }}
              </div>
            </div>

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
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-[10px] text-gray-400">{{
                      formatDate(order.created_at)
                    }}</span>
                    <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span class="text-[10px] text-gray-500 font-medium">
                      {{ order.payment_method?.name || 'Transfer Bank' }}
                    </span>
                  </div>
                </div>

                <!-- Status Badge — ✅ pakai getStatus(order) -->
                <span
                  :class="[
                    'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight border',
                    getStatus(order).cls,
                  ]"
                >
                  {{ getStatus(order).icon }} {{ getStatus(order).label }}
                </span>
              </div>

              <div class="mt-4 flex items-end justify-between border-t border-gray-50 pt-4">
                <div>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    Invoice
                  </p>
                  <p class="text-xs font-mono font-bold text-blue-600">
                    {{ order.order_code || `#INV-${String(order.id).padStart(4, '0')}` }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Icon Button — ✅ pakai getStatus(order) -->
                  <button
                    @click="handleActionClick(order, $event)"
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95',
                      needsUpload(order)
                        ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                    ]"
                    :title="needsUpload(order) ? 'Upload Bukti' : 'Lihat Detail'"
                  >
                    <svg
                      v-if="needsUpload(order)"
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>

                  <!-- Text Button — ✅ pakai getStatus(order) -->
                  <button
                    @click="handleActionClick(order, $event)"
                    :class="[
                      'px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm',
                      getStatus(order).btnCls,
                    ]"
                  >
                    <span class="flex items-center gap-1.5">
                      <span v-if="needsUpload(order)">📤</span>
                      {{ getStatus(order).btnText }}
                    </span>
                  </button>
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
