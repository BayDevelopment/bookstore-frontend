<script setup>
import { ref, computed } from 'vue'
import logo from '@/assets/images/logo-nav.png'

const cartItems = ref([])

const totalPrice = computed(() => {
  return cartItems.value.reduce((total, item) => {
    return total + item.price * item.qty
  }, 0)
})

const removeItem = (id) => {
  cartItems.value = cartItems.value.filter((item) => item.id !== id)
}

const updateQty = (item, type) => {
  if (type === 'inc') item.qty++
  if (type === 'dec' && item.qty > 1) item.qty--
}
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- BACKGROUND GRID -->
    <div class="absolute inset-0 grid-bg pointer-events-none"></div>

    <div class="relative max-w-7xl mx-auto px-6 py-12">
      <!-- TITLE -->
      <div class="mb-10">
        <h1 class="text-3xl font-semibold text-gray-800">Keranjang Belanja</h1>
        <p class="text-gray-400 text-sm mt-1">Periksa kembali pesananmu sebelum checkout</p>
      </div>

      <!-- ===================== -->
      <!-- ADA DATA -->
      <!-- ===================== -->
      <div v-if="cartItems.length > 0" class="grid md:grid-cols-3 gap-8">
        <!-- LIST -->
        <div class="md:col-span-2 space-y-4">
          <div
            v-for="item in cartItems"
            :key="item.id"
            class="group bg-white/80 backdrop-blur-md rounded-2xl p-4 flex gap-4 items-center border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <!-- IMAGE -->
            <div class="overflow-hidden rounded-lg">
              <img
                :src="item.image"
                class="w-20 h-20 object-cover group-hover:scale-105 transition"
              />
            </div>

            <!-- INFO -->
            <div class="flex-1">
              <h2 class="font-semibold text-gray-800 text-sm group-hover:text-blue-600 transition">
                {{ item.title }}
              </h2>

              <p class="text-blue-600 font-semibold mt-1">Rp {{ item.price.toLocaleString() }}</p>

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
              </div>
            </div>

            <!-- REMOVE -->
            <button
              @click="removeItem(item.id)"
              class="text-gray-400 hover:text-red-500 transition text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- SUMMARY -->
        <div
          class="bg-white/90 backdrop-blur-md rounded-2xl p-6 h-fit border border-gray-100 shadow-sm"
        >
          <h3 class="font-semibold text-gray-800 mb-4">Ringkasan</h3>

          <div class="flex justify-between text-gray-600 mb-2">
            <span>Total</span>
            <span class="font-semibold text-gray-800"> Rp {{ totalPrice.toLocaleString() }} </span>
          </div>

          <button
            class="w-full mt-5 bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 hover:shadow-lg transition"
          >
            Checkout
          </button>
        </div>
      </div>

      <!-- ===================== -->
      <!-- KOSONG -->
      <!-- ===================== -->
      <div v-else class="flex flex-col items-center justify-center text-center py-24">
        <!-- Glow -->
        <div class="absolute w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-3xl"></div>

        <!-- Logo -->
        <img
          :src="logo"
          alt="empty cart"
          class="w-28 h-28 object-contain opacity-80 mb-6 relative z-10"
        />

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
/* GRID BACKGROUND */
.grid-bg {
  background:
    linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* SHIMMER */
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
</style>
