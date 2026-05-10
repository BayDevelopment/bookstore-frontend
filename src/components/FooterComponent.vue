<script setup lang="js">
import logo from '@/assets/images/logo-nav.png'

const currentYear = new Date().getFullYear()
const developerName = 'Bayu Albar Ladici'
const brandName = 'Bookstore Alkhairiyah'
</script>

<template>
  <footer class="relative bg-white border-t border-gray-100 overflow-hidden">
    <!-- Background Subtle: Grid Biru yang diselaraskan -->
    <div class="absolute inset-0 pointer-events-none opacity-20">
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
    </div>

    <!-- Dekorasi "Angin" kecil di pojok footer agar senada dengan section kategori -->
    <div
      class="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl pointer-events-none"
    ></div>

    <div class="relative max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
      <!-- Brand Section -->
      <div class="space-y-4">
        <router-link
          to="/"
          class="flex items-center gap-3 group transition-transform hover:scale-105 duration-300"
        >
          <img :src="logo" :alt="brandName" class="w-40 object-contain drop-shadow-sm" />
        </router-link>
        <p class="text-xs text-gray-400 leading-relaxed max-w-xs">
          Solusi literasi digital untuk seluruh civitas akademika Alkhairiyah. Temukan buku
          terbaikmu di sini.
        </p>
      </div>

      <!-- Menu Navigasi -->
      <div>
        <h3 class="font-bold text-gray-800 mb-5 text-sm uppercase tracking-wider">Navigasi</h3>
        <ul class="space-y-3 text-sm text-gray-500">
          <li>
            <router-link to="/" class="hover:text-blue-600 transition-colors">Home</router-link>
          </li>
          <li>
            <router-link to="/books" class="hover:text-blue-600 transition-colors"
              >Katalog Buku</router-link
            >
          </li>
          <li>
            <router-link to="/keranjang" class="hover:text-blue-600 transition-colors"
              >Keranjang</router-link
            >
          </li>
        </ul>
      </div>

      <!-- Layanan Bantuan -->
      <div>
        <h3 class="font-bold text-gray-800 mb-5 text-sm uppercase tracking-wider">Bantuan</h3>
        <ul class="space-y-3 text-sm text-gray-500">
          <li>
            <router-link to="/login" class="hover:text-blue-600 transition-colors"
              >Masuk Akun</router-link
            >
          </li>
          <li>
            <router-link to="/register" class="hover:text-blue-600 transition-colors"
              >Daftar Baru</router-link
            >
          </li>
        </ul>
      </div>

      <!-- Kontak & Info -->
      <div>
        <h3 class="font-bold text-gray-800 mb-5 text-sm uppercase tracking-wider">Hubungi Kami</h3>
        <div class="space-y-3">
          <a
            href="mailto:support@alkhairiyah.ac.id"
            class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <span class="text-blue-500 text-base">📧</span> support@alkhairiyah.ac.id
          </a>
          <a
            href="https://wa.me/6281399758951"
            target="_blank"
            class="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <span class="text-green-500 text-base">📱</span> +62 813 9975 8951
          </a>
        </div>
      </div>
    </div>

    <!-- Bottom Footer -->
    <div class="relative border-t border-gray-50 bg-gray-50/30 py-6 px-6">
      <div
        class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-gray-400"
      >
        <div class="flex items-center gap-1">
          <span>© {{ currentYear }}</span>
          <span class="text-gray-600 font-semibold">{{ brandName }}</span>
          <span>• All rights reserved.</span>
        </div>
        <div class="flex items-center gap-1">
          <span>Developed with 💙 by</span>
          <span class="text-blue-600 hover:underline cursor-default">{{ developerName }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
