<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import logo from '@/assets/images/logo-nav.png'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()
const cartItems = ref([])
const loading = ref(true)
const isUpdating = ref(false)

async function fetchCart() {
  loading.value = true
  try {
    const { data } = await api.get('/cart')
    cartItems.value = data.data.map((item) => ({
      cartId: item.id,
      type: item.type,
      qty: item.qty,
      price: Number(item.price ?? 0),
      image: item.book.cover ?? null,
      id: item.book.id,
      title: item.book.title,
      author: item.book.author,
      stock: item.book.stock,
    }))
  } catch (e) {
    console.error('Gagal fetch cart:', e.response?.data ?? e.message)
  } finally {
    loading.value = false
  }
}

const totalPrice = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.price * item.qty, 0),
)

async function removeItem(cartId) {
  const confirm = await Swal.fire({
    title: 'Hapus dari keranjang?',
    text: 'Buku ini akan dikeluarkan dari daftar belanjaanmu.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
  })

  if (!confirm.isConfirmed) return

  try {
    await api.delete(`/cart/${cartId}`)
    cartItems.value = cartItems.value.filter((item) => item.cartId !== cartId)
    window.dispatchEvent(new Event('cart-updated'))

    Swal.fire({
      icon: 'success',
      title: 'Dihapus!',
      timer: 1000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
  } catch {
    Swal.fire({ icon: 'error', title: 'Gagal menghapus item' })
  }
}

async function updateQty(item, type) {
  if (isUpdating.value) return
  if (item.type === 'pdf') return

  const newQty = type === 'inc' ? item.qty + 1 : item.qty - 1

  if (newQty < 1) return
  if (newQty > item.stock) {
    Swal.fire({
      icon: 'warning',
      title: 'Stok Terbatas',
      text: `Maksimal stok tersedia: ${item.stock}`,
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false,
    })
    return
  }

  isUpdating.value = true
  try {
    const { data } = await api.patch(`/cart/${item.cartId}`, { quantity: newQty })
    item.qty = data.data.qty
    item.price = Number(data.data.price ?? item.price)
    window.dispatchEvent(new Event('cart-updated'))
  } catch {
    fetchCart()
  } finally {
    isUpdating.value = false
  }
}

function goCheckout() {
  if (cartItems.value.length === 0) return
  router.push('/checkout')
}

onMounted(fetchCart)
</script>

<template>
  <div class="relative overflow-hidden min-h-screen bg-gray-50/50">
    <div class="absolute inset-0 grid-bg pointer-events-none"></div>

    <div class="relative max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
      <!-- Header -->
      <div class="mb-6 sm:mb-8 lg:mb-10 px-1 sm:px-0">
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Keranjang Belanja</h1>
        <p class="text-gray-500 text-xs sm:text-sm mt-1">Selesaikan pesananmu dan mulai belajar!</p>
      </div>

      <!-- LOADING / SKELETON -->
      <div v-if="loading" class="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div class="lg:col-span-2 space-y-3 sm:space-y-4">
          <div
            v-for="n in 3"
            :key="n"
            class="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 border border-gray-100"
          >
            <div class="skeleton w-20 h-28 sm:w-24 sm:h-32 rounded-lg sm:rounded-xl shrink-0"></div>
            <div class="flex-1 space-y-2 sm:space-y-3 min-w-0">
              <div class="skeleton h-4 sm:h-5 rounded w-3/4"></div>
              <div class="skeleton h-3 sm:h-4 rounded w-1/3"></div>
              <div class="skeleton h-7 sm:h-8 rounded w-28 sm:w-32 mt-3 sm:mt-4"></div>
            </div>
          </div>
        </div>
        <div class="skeleton h-52 sm:h-64 rounded-xl sm:rounded-2xl hidden lg:block"></div>
      </div>

      <!-- CART LIST -->
      <div v-else-if="cartItems.length > 0" class="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div class="lg:col-span-2 space-y-3 sm:space-y-4">
          <div
            v-for="item in cartItems"
            :key="item.cartId"
            class="group bg-white/70 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-5 items-start sm:items-center border border-gray-100 shadow-sm hover:shadow-lg sm:hover:shadow-xl transition-all duration-300"
          >
            <!-- BOOK COVER -->
            <div
              class="w-20 h-28 sm:w-24 sm:h-32 overflow-hidden rounded-lg sm:rounded-xl shrink-0 bg-gray-50 shadow-inner"
            >
              <img
                v-if="item.image"
                :src="item.image"
                class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                loading="lazy"
                alt="Book cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-3xl sm:text-4xl"
              >
                📚
              </div>
            </div>

            <!-- BOOK INFO -->
            <div class="flex-1 min-w-0 py-0.5 sm:py-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <h2
                    class="font-bold text-gray-800 text-sm sm:text-base lg:text-lg leading-tight group-hover:text-blue-600 transition line-clamp-2 sm:line-clamp-none sm:truncate"
                  >
                    {{ item.title }}
                  </h2>
                  <p class="text-gray-500 text-xs sm:text-sm italic mt-0.5 sm:mt-1 truncate">
                    {{ item.author }}
                  </p>
                </div>

                <!-- Delete button - mobile optimized -->
                <button
                  @click="removeItem(item.cartId)"
                  class="p-1.5 sm:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0 -mt-1 -mr-1 sm:mt-0 sm:mr-0"
                  title="Hapus"
                >
                  <span class="text-lg sm:text-xl">✕</span>
                </button>
              </div>

              <!-- Badge Tipe -->
              <span
                class="inline-block text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full mt-2"
                :class="
                  item.type === 'print'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-indigo-50 text-indigo-600'
                "
              >
                {{ item.type === 'print' ? '📦 Buku Cetak' : '💻 PDF Digital' }}
              </span>

              <!-- Mobile: Price + Qty stacked -->
              <div
                class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mt-3 sm:mt-4"
              >
                <!-- QTY CONTROL — hanya untuk print -->
                <div
                  v-if="item.type === 'print'"
                  class="flex items-center bg-gray-100 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-gray-200 self-start"
                >
                  <button
                    @click="updateQty(item, 'dec')"
                    :disabled="item.qty <= 1 || isUpdating"
                    class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-30 transition shadow-sm text-sm sm:text-base"
                  >
                    −
                  </button>
                  <span
                    class="px-3 sm:px-4 font-bold text-gray-700 min-w-[32px] sm:min-w-[40px] text-center text-sm sm:text-base"
                  >
                    {{ item.qty }}
                  </span>
                  <button
                    @click="updateQty(item, 'inc')"
                    :disabled="item.qty >= item.stock || isUpdating"
                    class="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md sm:rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-30 transition shadow-sm text-sm sm:text-base"
                  >
                    +
                  </button>
                </div>

                <!-- PDF — qty tetap 1 -->
                <div v-else class="flex items-center gap-2 self-start">
                  <span class="text-[10px] sm:text-xs text-indigo-400 font-medium"
                    >Lisensi Digital × 1</span
                  >
                </div>

                <p class="text-blue-600 font-black text-base sm:text-lg lg:text-xl">
                  Rp {{ (item.price * item.qty).toLocaleString('id-ID') }}
                </p>
              </div>

              <p
                v-if="item.type === 'print'"
                class="text-[10px] text-gray-400 mt-1.5 sm:mt-2 uppercase tracking-wider font-semibold"
              >
                Stok: {{ item.stock }}
              </p>
            </div>
          </div>
        </div>

        <!-- SUMMARY PANEL -->
        <div class="lg:col-span-1">
          <div
            class="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-blue-50 lg:sticky lg:top-10"
          >
            <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
              Ringkasan Pesanan
            </h3>

            <div class="space-y-3 sm:space-y-4">
              <div class="flex justify-between text-gray-500 font-medium text-sm sm:text-base">
                <span>Total Items</span>
                <span>{{ cartItems.length }} Buku</span>
              </div>
              <div class="flex justify-between text-gray-500 font-medium text-sm sm:text-base">
                <span>Subtotal</span>
                <span>Rp {{ totalPrice.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between font-medium text-green-600 text-sm sm:text-base">
                <span>Biaya Admin</span>
                <span>Gratis</span>
              </div>

              <div class="pt-4 sm:pt-6 border-t border-gray-100 flex justify-between items-end">
                <span class="text-gray-800 font-bold text-sm sm:text-base">Total Pembayaran</span>
                <span class="text-xl sm:text-2xl font-black text-blue-600 leading-none">
                  Rp {{ totalPrice.toLocaleString('id-ID') }}
                </span>
              </div>
            </div>

            <button
              @click="goCheckout"
              class="w-full mt-6 sm:mt-8 bg-blue-600 text-white py-3.5 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-200 transition-all duration-300 font-bold text-base sm:text-lg flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              Lanjut ke Checkout
              <span class="group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <p
              class="text-center text-[10px] sm:text-xs text-gray-400 mt-3 sm:mt-4 px-2 sm:px-4 uppercase tracking-tighter"
            >
              Aman & Terenkripsi dengan SSL Unival
            </p>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div
        v-else
        class="flex flex-col items-center justify-center text-center py-16 sm:py-24 lg:py-32 relative px-4"
      >
        <div
          class="absolute w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] lg:w-[400px] lg:h-[400px] bg-blue-400/10 rounded-full blur-[80px] sm:blur-[100px]"
        ></div>
        <div class="relative">
          <img
            :src="logo"
            class="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 object-contain opacity-20 mb-6 sm:mb-8 grayscale"
            alt="Logo"
          />
        </div>
        <h2 class="text-xl sm:text-2xl font-bold text-gray-800 relative z-10">
          Keranjangmu Kosong
        </h2>
        <p class="text-gray-400 mt-2 sm:mt-3 max-w-xs text-sm sm:text-base relative z-10 px-4">
          Sepertinya kamu belum menemukan buku yang cocok.
        </p>
        <router-link
          to="/books"
          class="mt-6 sm:mt-10 px-8 sm:px-10 py-3 sm:py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 font-bold shadow-lg shadow-blue-100 relative z-10 text-sm sm:text-base active:scale-[0.98]"
        >
          Mulai Cari Buku
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-bg {
  background-image:
    linear-gradient(to right, rgba(59, 130, 246, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
  background-size: 32px 32px;
}
.grid-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(59, 130, 246, 0.1) 50%,
    transparent 100%
  );
  animation: shimmer 12s linear infinite;
}
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
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

/* Utility for line clamping */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Touch optimization */
@media (hover: none) {
  .group:active {
    transform: translateY(-1px);
  }
}
</style>
