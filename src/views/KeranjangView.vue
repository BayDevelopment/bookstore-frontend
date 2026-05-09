<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import logo from '@/assets/images/logo-nav.png'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()
const cartItems = ref([])
const loading = ref(true)
const isUpdating = ref(false) // Mencegah spam click

// Ambil Base URL dari .env
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL

async function fetchCart() {
  loading.value = true
  try {
    const { data } = await api.get('/cart')
    cartItems.value = data.data.map((item) => ({
      cartId: item.id,
      id: item.book_id,
      title: item.book.title,
      author: item.book.author,
      price: Number(item.book.price),
      qty: item.qty,
      stock: item.book.stock,
      image: item.book.cover?.startsWith('http')
        ? item.book.cover
        : item.book.cover
          ? `${STORAGE_URL}/${item.book.cover}`
          : null,
    }))
  } catch (e) {
    console.error('Gagal fetch cart:', e.response?.data ?? e.message)
  } finally {
    loading.value = false
  }
}

const totalPrice = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.price * item.qty, 0)
})

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

    // Trigger event untuk navbar (jika ada badge cart)
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
  if (isUpdating.value) return // Kunci jika sedang proses

  const newQty = type === 'inc' ? item.qty + 1 : item.qty - 1

  if (newQty < 1) return
  if (type === 'inc' && newQty > item.stock) {
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
    await api.patch(`/cart/${item.cartId}`, { quantity: newQty })
    item.qty = newQty // Update UI secara lokal
    window.dispatchEvent(new Event('cart-updated'))
  } catch (e) {
    console.error('Gagal update qty:', e.response?.data ?? e.message)
    // Rollback jika gagal
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
    <!-- DECORATION -->
    <div class="absolute inset-0 grid-bg pointer-events-none"></div>

    <div class="relative max-w-7xl mx-auto px-6 py-12">
      <div class="mb-10">
        <h1 class="text-3xl font-bold text-gray-800">Keranjang Belanja</h1>
        <p class="text-gray-500 text-sm mt-1">Selesaikan pesananmu dan mulai belajar!</p>
      </div>

      <!-- LOADING / SKELETON -->
      <div v-if="loading" class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-4">
          <div
            v-for="n in 3"
            :key="n"
            class="bg-white rounded-2xl p-4 flex gap-4 border border-gray-100"
          >
            <div class="skeleton w-24 h-24 rounded-xl shrink-0"></div>
            <div class="flex-1 space-y-3">
              <div class="skeleton h-5 rounded w-3/4"></div>
              <div class="skeleton h-4 rounded w-1/4"></div>
              <div class="skeleton h-8 rounded w-32 mt-4"></div>
            </div>
          </div>
        </div>
        <div class="skeleton h-64 rounded-2xl"></div>
      </div>

      <!-- CART LIST -->
      <div v-else-if="cartItems.length > 0" class="grid lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-4">
          <div
            v-for="item in cartItems"
            :key="item.cartId"
            class="group bg-white/70 backdrop-blur-md rounded-2xl p-4 flex gap-5 items-center border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <!-- BOOK COVER -->
            <div class="w-24 h-32 overflow-hidden rounded-xl shrink-0 bg-gray-50 shadow-inner">
              <img
                v-if="item.image"
                :src="item.image"
                class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-4xl">📚</div>
            </div>

            <!-- BOOK INFO -->
            <div class="flex-1 min-w-0">
              <h2
                class="font-bold text-gray-800 text-base md:text-lg truncate group-hover:text-blue-600 transition"
              >
                {{ item.title }}
              </h2>
              <p class="text-gray-500 text-xs md:text-sm italic mb-2">{{ item.author }}</p>

              <div class="flex flex-wrap items-center justify-between gap-4 mt-4">
                <!-- QUANTITY CONTROLS -->
                <div class="flex items-center bg-gray-100 rounded-xl p-1 border border-gray-200">
                  <button
                    @click="updateQty(item, 'dec')"
                    :disabled="item.qty <= 1 || isUpdating"
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-30 transition shadow-sm"
                  >
                    -
                  </button>
                  <span class="px-4 font-bold text-gray-700 min-w-[40px] text-center">{{
                    item.qty
                  }}</span>
                  <button
                    @click="updateQty(item, 'inc')"
                    :disabled="item.qty >= item.stock || isUpdating"
                    class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:text-blue-600 disabled:opacity-30 transition shadow-sm"
                  >
                    +
                  </button>
                </div>

                <p class="text-blue-600 font-black text-lg">
                  Rp {{ (item.price * item.qty).toLocaleString('id-ID') }}
                </p>
              </div>
              <p class="text-[10px] text-gray-400 mt-2 uppercase tracking-wider font-semibold">
                Stok: {{ item.stock }}
              </p>
            </div>

            <!-- DELETE ACTION -->
            <button
              @click="removeItem(item.cartId)"
              class="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
              title="Hapus"
            >
              <span class="text-xl">✕</span>
            </button>
          </div>
        </div>

        <!-- SUMMARY PANEL -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-3xl p-8 shadow-xl border border-blue-50 sticky top-10">
            <h3 class="text-xl font-bold text-gray-800 mb-6">Ringkasan Pesanan</h3>

            <div class="space-y-4">
              <div class="flex justify-between text-gray-500 font-medium">
                <span>Total Items</span>
                <span>{{ cartItems.length }} Buku</span>
              </div>
              <div class="flex justify-between text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>Rp {{ totalPrice.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between text-gray-500 font-medium text-green-600">
                <span>Biaya Admin</span>
                <span>Gratis</span>
              </div>

              <div class="pt-6 border-t border-gray-100 flex justify-between items-end">
                <span class="text-gray-800 font-bold">Total Pembayaran</span>
                <span class="text-2xl font-black text-blue-600 leading-none">
                  Rp {{ totalPrice.toLocaleString('id-ID') }}
                </span>
              </div>
            </div>

            <button
              @click="goCheckout"
              class="w-full mt-8 bg-blue-600 text-white py-4 rounded-2xl hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-2 group"
            >
              Lanjut ke Checkout
              <span class="group-hover:translate-x-1 transition-transform">→</span>
            </button>

            <p class="text-center text-[10px] text-gray-400 mt-4 px-4 uppercase tracking-tighter">
              Aman & Terenkripsi dengan SSL Unival
            </p>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else class="flex flex-col items-center justify-center text-center py-32 relative">
        <div class="absolute w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[100px]"></div>
        <div class="relative">
          <img :src="logo" class="w-32 h-32 object-contain opacity-20 mb-8 grayscale" />
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-6xl">🛒</span>
          </div>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 relative z-10">Keranjangmu Kosong Melompong</h2>
        <p class="text-gray-400 mt-3 max-w-xs relative z-10">
          Sepertinya kamu belum menemukan buku yang cocok untuk dipelajari hari ini.
        </p>
        <router-link
          to="/books"
          class="mt-10 px-10 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 font-bold shadow-lg shadow-blue-100 relative z-10"
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
</style>
