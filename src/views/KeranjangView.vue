<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/lib/axios'
import logo from '@/assets/images/logo-nav.png'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const router = useRouter()
const cartItems = ref([])
const loading = ref(true)

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
          ? `/storage/${item.book.cover}`
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
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Hapus',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444',
  })
  if (!confirm.isConfirmed) return

  try {
    await api.delete(`/cart/${cartId}`)
    cartItems.value = cartItems.value.filter((item) => item.cartId !== cartId)
    window.dispatchEvent(new Event('cart-updated'))
    Swal.fire({
      icon: 'success',
      title: 'Dihapus!',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal hapus',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
  }
}

async function updateQty(item, type) {
  const newQty = type === 'inc' ? item.qty + 1 : item.qty - 1
  if (newQty < 1) return
  if (type === 'inc' && newQty > item.stock) {
    Swal.fire({
      icon: 'warning',
      title: 'Stok tidak cukup!',
      timer: 1500,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
    return
  }

  try {
    await api.patch(`/cart/${item.cartId}`, { quantity: newQty })
    item.qty = newQty
  } catch (e) {
    console.error('Gagal update qty:', e.response?.data ?? e.message)
  }
}

function goCheckout() {
  router.push('/checkout')
}

onMounted(fetchCart)
</script>

<template>
  <div class="relative overflow-hidden min-h-screen">
    <div class="absolute inset-0 grid-bg pointer-events-none"></div>

    <div class="relative max-w-7xl mx-auto px-6 py-12">
      <div class="mb-10">
        <h1 class="text-3xl font-semibold text-gray-800">Keranjang Belanja</h1>
        <p class="text-gray-400 text-sm mt-1">Periksa kembali pesananmu sebelum checkout</p>
      </div>

      <!-- SKELETON -->
      <div v-if="loading" class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-4">
          <div
            v-for="n in 3"
            :key="n"
            class="bg-white/80 rounded-2xl p-4 flex gap-4 border border-gray-100"
          >
            <div class="skeleton w-20 h-20 rounded-lg shrink-0"></div>
            <div class="flex-1 space-y-2">
              <div class="skeleton h-4 rounded w-3/4"></div>
              <div class="skeleton h-4 rounded w-1/3"></div>
              <div class="skeleton h-8 rounded w-28 mt-3"></div>
            </div>
          </div>
        </div>
        <div class="skeleton h-48 rounded-2xl"></div>
      </div>

      <!-- ADA DATA -->
      <div v-else-if="cartItems.length > 0" class="grid md:grid-cols-3 gap-8">
        <div class="md:col-span-2 space-y-4">
          <div
            v-for="item in cartItems"
            :key="item.cartId"
            class="group bg-white/80 backdrop-blur-md rounded-2xl p-4 flex gap-4 items-center border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <!-- IMAGE -->
            <div class="overflow-hidden rounded-lg shrink-0">
              <img
                v-if="item.image"
                :src="item.image"
                class="w-20 h-20 object-cover group-hover:scale-105 transition"
              />
              <div
                v-else
                class="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-lg text-3xl"
              >
                📚
              </div>
            </div>

            <!-- INFO -->
            <div class="flex-1">
              <h2 class="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition">
                {{ item.title }}
              </h2>
              <p class="text-gray-400 text-xs">{{ item.author }}</p>
              <p class="text-blue-600 font-semibold mt-1">
                Rp {{ item.price.toLocaleString('id-ID') }}
              </p>

              <!-- QTY -->
              <div class="flex items-center gap-2 mt-3">
                <button
                  @click="updateQty(item, 'dec')"
                  class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-blue-100 transition"
                >
                  -
                </button>
                <span class="px-3 font-medium">{{ item.qty }}</span>
                <button
                  @click="updateQty(item, 'inc')"
                  class="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-blue-100 transition"
                >
                  +
                </button>
                <span class="text-xs text-gray-400 ml-1">Stok: {{ item.stock }}</span>
              </div>
            </div>

            <!-- REMOVE -->
            <button
              @click="removeItem(item.cartId)"
              class="text-gray-400 hover:text-red-500 transition text-lg shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- SUMMARY -->
        <div
          class="bg-white/90 backdrop-blur-md rounded-2xl p-6 h-fit border border-gray-100 shadow-sm sticky top-6"
        >
          <h3 class="font-semibold text-gray-800 mb-4">Ringkasan</h3>
          <div class="flex justify-between text-gray-600 mb-2">
            <span>{{ cartItems.length }} item</span>
            <span class="font-semibold text-gray-800"
              >Rp {{ totalPrice.toLocaleString('id-ID') }}</span
            >
          </div>
          <hr class="my-4 border-gray-100" />
          <div class="flex justify-between font-bold text-gray-800">
            <span>Total</span>
            <span class="text-blue-600">Rp {{ totalPrice.toLocaleString('id-ID') }}</span>
          </div>
          <button
            @click="goCheckout"
            class="w-full mt-5 bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 hover:shadow-lg transition font-semibold"
          >
            Checkout →
          </button>
        </div>
      </div>

      <!-- KOSONG -->
      <div v-else class="flex flex-col items-center justify-center text-center py-24">
        <div class="absolute w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-3xl"></div>
        <img :src="logo" class="w-28 h-28 object-contain opacity-80 mb-6 relative z-10" />
        <h2 class="text-lg font-semibold text-gray-700 relative z-10">Keranjang masih kosong</h2>
        <p class="text-gray-400 text-sm mt-2 relative z-10">
          Yuk tambahkan buku ke dalam keranjang kamu
        </p>
        <router-link
          to="/books"
          class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-lg transition relative z-10"
        >
          Lihat Buku
        </router-link>
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
.grid-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(59, 130, 246, 0.15) 30%,
    rgba(59, 130, 246, 0.3) 50%,
    rgba(59, 130, 246, 0.15) 70%,
    transparent 100%
  );
  animation: shimmer 8s linear infinite;
  mix-blend-mode: lighten;
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
