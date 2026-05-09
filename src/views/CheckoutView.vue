<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'

const route = useRoute()
const router = useRouter()

const book = ref(null)
const cartItems = ref([])
const loading = ref(true)
const error = ref(null)
const quantity = ref(1)
const paymentMethods = ref([])
const selectedMethod = ref(null)
const orderLoading = ref(false)
const orderError = ref(null)

const token = localStorage.getItem('token')
const isFromCart = computed(() => !route.query.book_id)
const copied = ref(false)

// ✅ [FIX #1] Base URL dari env variable, tidak hardcoded
const storageBase = import.meta.env.VITE_STORAGE_URL ?? '/storage'

// ✅ [FIX #2] maxQty pakai konstanta, tidak hardcoded angka
const MAX_QTY = 10
const maxQty = computed(() => Math.min(book.value?.stock ?? 1, MAX_QTY))

// ✅ [FIX #3] copyNorek dengan fallback untuk HTTP / browser lama
async function copyNorek() {
  const norek = selectedMethod.value?.account_number
  if (!norek) return
  try {
    await navigator.clipboard.writeText(norek)
  } catch {
    // fallback untuk browser yang tidak support clipboard API
    const el = document.createElement('textarea')
    el.value = norek
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

onMounted(async () => {
  if (!token) {
    router.push('/login')
    return
  }

  try {
    if (isFromCart.value) {
      const [cartRes, methodRes] = await Promise.all([
        api.get('/cart'),
        api.get('/payment-methods').catch(() => ({ data: { data: [] } })),
      ])
      cartItems.value = cartRes.data.data.map((item) => ({
        cartId: item.id,
        book_id: item.book_id,
        title: item.book.title,
        author: item.book.author,
        price: Number(item.book.price),
        qty: item.qty,
        stock: item.book.stock,
        // ✅ [FIX #1] pakai storageBase
        image: item.book.cover?.startsWith('http')
          ? item.book.cover
          : item.book.cover
            ? `${storageBase}/${item.book.cover}`
            : null,
      }))
      paymentMethods.value = methodRes.data.data ?? []
    } else {
      const [bookRes, methodRes] = await Promise.all([
        api.get(`/books/${route.query.book_id}`),
        api.get('/payment-methods').catch(() => ({ data: { data: [] } })),
      ])
      book.value = bookRes.data.data ?? bookRes.data
      paymentMethods.value = methodRes.data.data ?? []
    }

    if (paymentMethods.value.length > 0) selectedMethod.value = paymentMethods.value[0]
  } catch {
    // ✅ [FIX #4] hapus (e) karena tidak dipakai — hindari ESLint warning
    error.value = 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
})

// ✅ [FIX #1] coverSrc pakai storageBase
const coverSrc = computed(() => {
  const c = book.value?.cover
  if (!c) return null
  return c.startsWith('http') ? c : `${storageBase}/${c}`
})

const totalPrice = computed(() => {
  if (isFromCart.value) {
    return cartItems.value.reduce((sum, item) => sum + item.price * item.qty, 0)
  }
  return Number(book.value?.price ?? 0) * quantity.value
})

const formattedTotal = computed(() => totalPrice.value.toLocaleString('id-ID'))
const isCash = computed(() => selectedMethod.value?.code === 'cash')

// ✅ [FIX #5] type="button" ditambahkan di template, fungsi tetap sama
function increment() {
  if (quantity.value < maxQty.value) quantity.value++
}
function decrement() {
  if (quantity.value > 1) quantity.value--
}

async function handleOrder() {
  if (!selectedMethod.value) {
    orderError.value = 'Pilih metode pembayaran terlebih dahulu.'
    return
  }
  orderLoading.value = true
  orderError.value = null

  try {
    const payload = isFromCart.value
      ? {
          items: cartItems.value.map((i) => ({ book_id: i.book_id, quantity: i.qty })),
          payment_method_id: selectedMethod.value.id,
          from_cart: true,
        }
      : {
          items: [{ book_id: book.value.id, quantity: quantity.value }],
          payment_method_id: selectedMethod.value.id,
        }

    const { data } = await api.post('/orders', payload)
    const orderId = data.data?.id ?? null

    if (isFromCart.value) window.dispatchEvent(new Event('cart-updated'))

    if (isCash.value) {
      router.push(orderId ? `/orders/${orderId}` : '/orders')
    } else {
      router.push({ path: '/orders', query: { new: orderId } })
    }
  } catch (e) {
    orderError.value = e.response?.data?.message ?? 'Gagal membuat pesanan. Coba lagi.'
    orderLoading.value = false
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <div class="relative max-w-xl mx-auto px-6 pt-8 pb-16">
      <!-- BACK -->
      <!-- ✅ [FIX #5] type="button" pada semua tombol -->
      <button
        type="button"
        @click="router.back()"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition group mb-6"
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
        Kembali
      </button>

      <h1 class="text-2xl font-bold text-gray-900 mb-6">🛒 Checkout</h1>

      <!-- SKELETON -->
      <div v-if="loading" class="space-y-4">
        <div class="bg-white/80 rounded-2xl p-5 space-y-4">
          <div class="skeleton h-4 rounded w-1/2"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-12 rounded-xl"></div>
        </div>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="flex flex-col items-center py-24 text-center">
        <p class="text-4xl mb-3">⚠️</p>
        <p class="text-gray-600">{{ error }}</p>
        <button
          type="button"
          @click="router.back()"
          class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
        >
          Kembali
        </button>
      </div>

      <template v-else>
        <!-- CARD BUKU — dari keranjang -->
        <div
          v-if="isFromCart"
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Buku yang Dipesan
          </h2>
          <div class="space-y-3">
            <div v-for="item in cartItems" :key="item.cartId" class="flex gap-3 items-center">
              <div class="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.title"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-xl">📚</div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-gray-800 truncate">{{ item.title }}</p>
                <p class="text-xs text-gray-400">{{ item.author }}</p>
                <p class="text-blue-600 text-sm font-semibold">
                  Rp {{ item.price.toLocaleString('id-ID') }} × {{ item.qty }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- CARD BUKU — beli langsung -->
        <div
          v-else
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Buku yang Dipesan
          </h2>
          <div class="flex gap-4">
            <div class="shrink-0 w-14 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
              <img
                v-if="coverSrc"
                :src="coverSrc"
                :alt="book.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-2xl">📚</div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-800 truncate">{{ book.title }}</p>
              <p class="text-sm text-gray-500">{{ book.author }}</p>
              <p class="text-blue-600 font-bold mt-1">
                Rp {{ Number(book.price).toLocaleString('id-ID') }}
                <span class="text-xs text-gray-400 font-normal">/ buku</span>
              </p>
            </div>
          </div>
        </div>

        <!-- JUMLAH BUKU — hanya untuk beli langsung -->
        <div
          v-if="!isFromCart"
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Jumlah Buku
          </h2>
          <div class="flex items-center gap-4">
            <button
              type="button"
              @click="decrement"
              :disabled="quantity <= 1"
              class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              −
            </button>
            <span class="text-2xl font-bold text-gray-800 w-8 text-center">{{ quantity }}</span>
            <button
              type="button"
              @click="increment"
              :disabled="quantity >= maxQty"
              class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              +
            </button>
            <span class="text-xs text-gray-400 ml-2">Stok tersedia: {{ book?.stock }}</span>
          </div>
        </div>

        <!-- METODE PEMBAYARAN -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Metode Pembayaran
          </h2>
          <div v-if="paymentMethods.length === 0" class="text-sm text-gray-400 text-center py-4">
            Tidak ada metode pembayaran tersedia.
          </div>
          <div class="space-y-3">
            <label
              v-for="method in paymentMethods"
              :key="method.id"
              :class="[
                'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                selectedMethod?.id === method.id
                  ? method.code === 'cash'
                    ? 'border-green-400 bg-green-50/50'
                    : 'border-blue-400 bg-blue-50/50'
                  : 'border-gray-100 hover:border-gray-200',
              ]"
            >
              <input
                type="radio"
                name="payment"
                :value="method"
                v-model="selectedMethod"
                class="hidden"
              />
              <div
                :class="[
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  selectedMethod?.id === method.id
                    ? method.code === 'cash'
                      ? 'border-green-500'
                      : 'border-blue-500'
                    : 'border-gray-300',
                ]"
              >
                <div
                  v-if="selectedMethod?.id === method.id"
                  :class="[
                    'w-2.5 h-2.5 rounded-full',
                    method.code === 'cash' ? 'bg-green-500' : 'bg-blue-500',
                  ]"
                ></div>
              </div>
              <div class="flex-1">
                <p class="font-semibold text-sm text-gray-800">
                  {{ method.code === 'cash' ? '💵' : '🏦' }} {{ method.name }}
                </p>
                <p class="text-xs text-gray-500 mt-0.5">{{ method.description }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Detail Rekening Bank (muncul jika bukan cash) -->
        <transition name="slide-fade">
          <div
            v-if="selectedMethod && selectedMethod.code !== 'cash'"
            class="mt-4 mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100"
          >
            <p class="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">
              🏦 Detail Rekening Tujuan
            </p>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Bank</span>
                <span class="text-sm font-semibold text-gray-800">
                  {{ selectedMethod.bank_name ?? selectedMethod.name }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Atas Nama</span>
                <span class="text-sm font-semibold text-gray-800">
                  {{ selectedMethod.account_name ?? '-' }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">No. Rekening</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-blue-700 tracking-wider font-mono">
                    {{ selectedMethod.account_number ?? '-' }}
                  </span>
                  <!-- ✅ [FIX #5] type="button" -->
                  <button
                    v-if="selectedMethod.account_number"
                    type="button"
                    @click="copyNorek"
                    class="text-xs px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-md transition-colors"
                  >
                    {{ copied ? '✓ Disalin' : 'Salin' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- RINGKASAN & CTA -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Ringkasan
          </h2>
          <div class="space-y-2 mb-4">
            <div v-if="!isFromCart" class="flex justify-between text-sm">
              <span class="text-gray-500">Harga satuan</span>
              <span class="text-gray-700"
                >Rp {{ Number(book?.price).toLocaleString('id-ID') }}</span
              >
            </div>
            <div v-if="!isFromCart" class="flex justify-between text-sm">
              <span class="text-gray-500">Jumlah</span>
              <span class="text-gray-700">{{ quantity }} buku</span>
            </div>
            <div v-if="isFromCart" class="flex justify-between text-sm">
              <span class="text-gray-500">Total item</span>
              <span class="text-gray-700">{{ cartItems.length }} buku</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Metode</span>
              <span class="text-gray-700">{{ selectedMethod?.name ?? '-' }}</span>
            </div>
            <hr class="border-gray-100" />
            <div class="flex justify-between font-bold">
              <span class="text-gray-800">Total</span>
              <span class="text-blue-600 text-lg">Rp {{ formattedTotal }}</span>
            </div>
          </div>

          <p v-if="orderError" class="text-xs text-red-500 mb-3 text-center">⚠ {{ orderError }}</p>

          <!-- ✅ [FIX #5] type="button" -->
          <button
            type="button"
            @click="handleOrder"
            :disabled="orderLoading || !selectedMethod"
            :class="[
              'w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
              !orderLoading && selectedMethod
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ]"
          >
            <svg v-if="orderLoading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            {{
              orderLoading
                ? 'Memproses...'
                : isCash
                  ? '✅ Pesan & Bayar di Tempat'
                  : '✅ Konfirmasi Pesanan'
            }}
          </button>
        </div>
      </template>
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
.slide-fade-enter-active {
  transition: all 0.25s ease;
}
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
