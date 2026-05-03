<script setup>
import { ref } from 'vue'
import logo from '@/assets/images/logo-nav.png'

const books = ref([])
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- ===== BACKGROUND GRID + SHIMMER ===== -->
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <div class="relative max-w-7xl mx-auto px-6 py-12">
      <!-- TITLE -->
      <div class="mb-10">
        <h1 class="text-3xl font-semibold text-gray-800 mb-2">Daftar Buku</h1>
        <p class="text-gray-400 text-sm">Temukan buku terbaik sesuai kebutuhanmu</p>
      </div>

      <!-- ===================== -->
      <!-- ADA DATA -->
      <!-- ===================== -->
      <div v-if="books.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div
          v-for="book in books"
          :key="book.id"
          class="group bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          <!-- IMAGE -->
          <div class="overflow-hidden rounded-xl">
            <img
              :src="book.image"
              class="w-full h-40 object-cover rounded-xl group-hover:scale-105 transition duration-300"
            />
          </div>

          <!-- TITLE -->
          <h2
            class="font-semibold text-gray-800 text-sm mt-3 line-clamp-2 group-hover:text-blue-600 transition"
          >
            {{ book.title }}
          </h2>

          <!-- PRICE -->
          <p class="text-blue-600 font-semibold mt-2">Rp {{ book.price }}</p>

          <!-- CTA kecil -->
          <div class="mt-2 text-xs text-gray-400 group-hover:text-blue-500 transition">
            Lihat Detail →
          </div>
        </div>
      </div>

      <!-- ===================== -->
      <!-- EMPTY STATE -->
      <!-- ===================== -->
      <div v-else class="flex flex-col items-center justify-center text-center py-24">
        <!-- Glow -->
        <div class="absolute w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-3xl"></div>

        <!-- Logo -->
        <img
          :src="logo"
          alt="empty"
          class="w-28 h-28 object-contain opacity-80 mb-6 relative z-10"
        />

        <!-- Text -->
        <h2 class="text-lg font-semibold text-gray-700 relative z-10">Buku tidak ditemukan</h2>

        <p class="text-gray-400 text-sm mt-2 relative z-10">
          Saat ini belum ada data buku yang tersedia
        </p>

        <!-- Button -->
        <router-link
          to="/"
          class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 hover:shadow-lg transition relative z-10"
        >
          Kembali ke Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== GRID BACKGROUND ===== */
.grid-bg {
  background:
    linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}

/* SHIMMER EFFECT */
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

/* ANIMATION */
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
