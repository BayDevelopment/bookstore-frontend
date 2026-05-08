<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const book = ref(null)
const loading = ref(true)
const error = ref(null)
const quantity = ref(1)
const paymentMethods = ref([])
const selectedMethod = ref(null) // object PaymentMethod yang dipilih
const orderLoading = ref(false)
const orderError = ref(null)

const token = localStorage.getItem('token')

onMounted(async () => {
  if (!token) {
    router.push('/login')
    return
  }

  const bookId = route.query.book_id
  if (!bookId) {
    router.push('/books')
    return
  }

  try {
    const [bookRes, methodRes] = await Promise.all([
      axios.get(`/api/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios
        .get('/api/payment-methods', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(() => ({ data: { data: [] } })), // ← kalau 404, tidak crash
    ])

    book.value = bookRes.data.data ?? bookRes.data
    paymentMethods.value = methodRes.data.data ?? []

    if (paymentMethods.value.length > 0) {
      selectedMethod.value = paymentMethods.value[0]
    }
  } catch (e) {
    error.value = 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
})

const coverSrc = computed(() => {
  const c = book.value?.cover
  if (!c) return null
  return c.startsWith('http') ? c : `/storage/${c}`
})

const maxQty = computed(() => Math.min(book.value?.stock ?? 1, 10))
const totalPrice = computed(() => Number(book.value?.price ?? 0) * quantity.value)
const formattedTotal = computed(() => totalPrice.value.toLocaleString('id-ID'))
const isCash = computed(() => selectedMethod.value?.code === 'cash')

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
    const { data } = await axios.post(
      '/api/orders',
      {
        book_id: book.value.id,
        quantity: quantity.value,
        payment_method_id: selectedMethod.value.id, // ← ID dari tabel payment_methods
      },
      { headers: { Authorization: `Bearer ${token}` } },
    )

    const orderId = data.data?.id ?? null

    if (isCash.value) {
      // Cash → langsung ke detail
      router.push(orderId ? `/orders/${orderId}` : '/orders')
    } else {
      // Transfer → ke list pesanan + notif baru
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
      <button
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
          @click="router.back()"
          class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
        >
          Kembali
        </button>
      </div>

      <template v-else-if="book">
        <!-- CARD BUKU -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Buku yang Dipesan
          </h2>
          <div class="flex gap-4">
            <div class="shrink-0 w-14 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
              <img v-if="coverSrc" :src="coverSrc" class="w-full h-full object-cover" />
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

        <!-- JUMLAH BUKU -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Jumlah Buku
          </h2>
          <div class="flex items-center gap-4">
            <button
              @click="decrement"
              :disabled="quantity <= 1"
              class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              −
            </button>
            <span class="text-2xl font-bold text-gray-800 w-8 text-center">{{ quantity }}</span>
            <button
              @click="increment"
              :disabled="quantity >= maxQty"
              class="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              +
            </button>
            <span class="text-xs text-gray-400 ml-2">Stok tersedia: {{ book.stock }}</span>
          </div>
        </div>

        <!-- METODE PEMBAYARAN — dari API -->
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

              <!-- Radio indicator -->
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

        <!-- RINGKASAN & CTA -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Ringkasan
          </h2>
          <div class="space-y-2 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Harga satuan</span>
              <span class="text-gray-700">Rp {{ Number(book.price).toLocaleString('id-ID') }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Jumlah</span>
              <span class="text-gray-700">{{ quantity }} buku</span>
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

          <button
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
              ></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
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
</style>
