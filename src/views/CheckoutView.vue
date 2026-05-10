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

// ✅ Success state
const showSuccess = ref(false)
const successOrderId = ref(null)

const token = localStorage.getItem('token')
const isFromCart = computed(() => !route.query.book_id)
const bookType = computed(() => route.query.type ?? 'print')
const isPdf = computed(() => bookType.value === 'pdf')
const copied = ref(false)
const MAX_QTY = 10

const copyNorek = async () => {
  const norek = selectedMethod.value?.account_number
  if (!norek) return
  try {
    await navigator.clipboard.writeText(norek)
  } catch {
    const el = document.createElement('textarea')
    el.value = norek
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const bookPrice = computed(() => {
  if (!book.value) return 0
  return isPdf.value ? Number(book.value.price_pdf ?? 0) : Number(book.value.price_print ?? 0)
})

const maxQty = computed(() => {
  if (!book.value || isPdf.value) return 1
  return Math.min(book.value.stock ?? 1, MAX_QTY)
})

const coverSrc = computed(() => {
  if (!book.value?.cover) return null
  if (book.value.cover.startsWith('http')) return book.value.cover
  return `${import.meta.env.VITE_STORAGE_URL ?? '/storage'}/${book.value.cover}`
})

onMounted(async () => {
  if (!token) return router.push('/login')
  try {
    if (isFromCart.value) {
      const [cartRes, methodRes] = await Promise.all([
        api.get('/cart'),
        api.get('/payment-methods').catch(() => ({ data: { data: [] } })),
      ])
      cartItems.value = cartRes.data.data.map((item) => ({
        cartId: item.id,
        id: item.book.id,
        title: item.book.title,
        author: item.book.author,
        type: item.type,
        price: Number(item.price ?? 0),
        qty: item.qty,
        image: item.book.cover ?? null,
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
    error.value = 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
})

const totalPrice = computed(() => {
  if (isFromCart.value) return cartItems.value.reduce((s, i) => s + i.price * i.qty, 0)
  return bookPrice.value * (isPdf.value ? 1 : quantity.value)
})
const formattedTotal = computed(() => totalPrice.value.toLocaleString('id-ID'))
const isCash = computed(() => selectedMethod.value?.code === 'cash')

function increment() {
  if (isPdf.value || quantity.value >= maxQty.value) return
  quantity.value++
}
function decrement() {
  if (isPdf.value || quantity.value <= 1) return
  quantity.value--
}

async function handleOrder() {
  if (!selectedMethod.value) {
    orderError.value = 'Pilih metode pembayaran terlebih dahulu.'
    return
  }
  orderLoading.value = true
  orderError.value = null
  try {
    let payload = {}
    if (isFromCart.value) {
      payload = {
        payment_method_id: selectedMethod.value.id,
        from_cart: true,
        items: cartItems.value.map((i) => ({
          cart_id: i.cartId,
          book_id: i.id,
          quantity: i.qty,
          price: i.price,
          type: i.type,
        })),
      }
    } else {
      payload = {
        payment_method_id: selectedMethod.value.id,
        items: [
          {
            book_id: book.value.id,
            type: bookType.value,
            quantity: isPdf.value ? 1 : quantity.value,
            price: bookPrice.value,
          },
        ],
      }
    }
    const { data } = await api.post('/orders', payload)
    successOrderId.value = data.data?.id ?? null
    if (isFromCart.value) window.dispatchEvent(new Event('cart-updated'))
    showSuccess.value = true // ✅ Tampil modal sukses
  } catch (e) {
    orderError.value = e.response?.data?.message ?? 'Gagal membuat pesanan.'
  } finally {
    orderLoading.value = false
  }
}

function goToOrderDetail() {
  showSuccess.value = false
  router.push(successOrderId.value ? `/orders/${successOrderId.value}` : '/orders')
}
function goToOrders() {
  showSuccess.value = false
  router.push('/orders')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <!-- ✅ SUCCESS MODAL -->
    <Transition name="fade">
      <div v-if="showSuccess" class="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div
          class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-pop overflow-hidden"
        >
          <!-- Confetti dots dekoratif -->
          <div
            class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 via-blue-400 to-indigo-500"
          ></div>

          <!-- Lingkaran centang animasi -->
          <div class="relative w-24 h-24 mx-auto mb-5">
            <div class="absolute inset-0 bg-green-100 rounded-full animate-ping-slow"></div>
            <div
              class="relative w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-200"
            >
              <svg
                class="w-11 h-11 text-white checkmark"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 class="text-2xl font-bold text-gray-900 mb-1">Pesanan Berhasil! 🎉</h2>
          <p class="text-sm text-gray-400 mb-5">Terima kasih, pesananmu sudah kami terima.</p>

          <!-- Ringkasan -->
          <div class="bg-gray-50 rounded-2xl p-4 mb-4 text-left space-y-2.5">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Total Bayar</span>
              <span class="font-bold text-blue-600">Rp {{ formattedTotal }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Metode</span>
              <span class="font-semibold text-gray-700">{{ selectedMethod?.name }}</span>
            </div>
            <div v-if="successOrderId" class="flex justify-between text-sm">
              <span class="text-gray-400">ID Pesanan</span>
              <span class="font-mono font-bold text-gray-700">#{{ successOrderId }}</span>
            </div>
          </div>

          <!-- Hint selanjutnya -->
          <div
            v-if="!isCash"
            class="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-5 flex gap-2 text-left"
          >
            <span class="text-base shrink-0">📤</span>
            <p class="text-xs text-yellow-700 leading-relaxed">
              Segera <span class="font-bold">upload bukti pembayaran</span> agar pesananmu bisa
              diproses lebih cepat.
            </p>
          </div>
          <div
            v-else
            class="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex gap-2 text-left"
          >
            <span class="text-base shrink-0">🏛️</span>
            <p class="text-xs text-green-700 leading-relaxed">
              Datang ke <span class="font-bold">Bagian Akademik</span> dan tunjukkan ID pesanan
              untuk menyelesaikan pembayaran.
            </p>
          </div>

          <div class="flex flex-col gap-2">
            <button
              @click="goToOrderDetail"
              class="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition active:scale-95"
            >
              {{ isCash ? '📦 Lihat Detail Pesanan' : '📤 Upload Bukti Sekarang' }}
            </button>
            <button
              @click="goToOrders"
              class="w-full py-2.5 text-gray-500 text-sm hover:text-gray-700 transition"
            >
              Lihat Semua Pesanan →
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div class="relative max-w-xl mx-auto px-6 pt-8 pb-16">
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

      <div v-if="loading" class="space-y-4">
        <div class="bg-white/80 rounded-2xl p-5 space-y-4">
          <div class="skeleton h-4 rounded w-1/2"></div>
          <div class="skeleton h-24 rounded-xl"></div>
          <div class="skeleton h-12 rounded-xl"></div>
        </div>
      </div>

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
        <!-- BUKU dari keranjang -->
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
                <span
                  class="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  :class="
                    item.type === 'pdf'
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-blue-100 text-blue-600'
                  "
                  >{{ item.type === 'pdf' ? '💻 PDF' : '📦 Cetak' }}</span
                >
                <p class="text-blue-600 text-sm font-semibold mt-1">
                  Rp {{ item.price.toLocaleString('id-ID') }} × {{ item.qty }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- BUKU beli langsung -->
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
              <span
                class="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                :class="isPdf ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'"
                >{{ isPdf ? '💻 PDF Digital' : '📦 Buku Cetak' }}</span
              >
              <p class="text-blue-600 font-bold mt-1">
                Rp {{ bookPrice.toLocaleString('id-ID') }}
                <span class="text-xs text-gray-400 font-normal"
                  >/ {{ isPdf ? 'lisensi' : 'buku' }}</span
                >
              </p>
            </div>
          </div>
        </div>

        <!-- QTY print only -->
        <div
          v-if="!isFromCart && !isPdf"
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

        <!-- PDF info -->
        <div
          v-if="!isFromCart && isPdf"
          class="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 mb-4 flex items-center gap-3"
        >
          <span class="text-2xl">💻</span>
          <div>
            <p class="text-sm font-semibold text-indigo-700">PDF Digital</p>
            <p class="text-xs text-indigo-400 mt-0.5">
              Lisensi akan langsung aktif setelah pesanan dikonfirmasi.
            </p>
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

        <!-- DETAIL REKENING -->
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
                <span class="text-xs text-gray-500">Bank</span
                ><span class="text-sm font-semibold text-gray-800">{{
                  selectedMethod.bank_name ?? selectedMethod.name
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Atas Nama</span
                ><span class="text-sm font-semibold text-gray-800">{{
                  selectedMethod.account_name ?? '-'
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">No. Rekening</span>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-bold text-blue-700 tracking-wider font-mono">{{
                    selectedMethod.account_number ?? '-'
                  }}</span>
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

        <!-- RINGKASAN + TOMBOL ORDER -->
        <div class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Ringkasan
          </h2>
          <div class="space-y-2 mb-4">
            <template v-if="!isFromCart">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Tipe</span
                ><span class="text-gray-700">{{ isPdf ? '💻 PDF Digital' : '📦 Buku Cetak' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Harga satuan</span
                ><span class="text-gray-700">Rp {{ bookPrice.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Jumlah</span
                ><span class="text-gray-700">{{ isPdf ? '1 lisensi' : `${quantity} buku` }}</span>
              </div>
            </template>
            <template v-else>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Total item</span
                ><span class="text-gray-700">{{ cartItems.length }} buku</span>
              </div>
            </template>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Metode</span
              ><span class="text-gray-700">{{ selectedMethod?.name ?? '-' }}</span>
            </div>
            <hr class="border-gray-100" />
            <div class="flex justify-between font-bold">
              <span class="text-gray-800">Total</span
              ><span class="text-blue-600 text-lg">Rp {{ formattedTotal }}</span>
            </div>
          </div>
          <p v-if="orderError" class="text-xs text-red-500 mb-3 text-center">⚠ {{ orderError }}</p>
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.animate-pop {
  animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop {
  from {
    transform: scale(0.75);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-ping-slow {
  animation: ping-slow 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
}
@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.7);
    opacity: 0;
  }
}
.checkmark {
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: draw-check 0.45s ease 0.3s forwards;
}
@keyframes draw-check {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
