<script setup>
import logo from '@/assets/images/logo-nav.png'
</script>

<template>
  <footer class="relative bg-white border-t border-gray-100 mt-20 overflow-hidden">
    <!-- Background subtle grid -->
    <div class="absolute inset-0 pointer-events-none opacity-30">
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.1)_1px,transparent_1px), linear-gradient(to_bottom,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
      <!-- Brand -->
      <router-link to="/" class="flex items-center gap-3 group">
        <!-- Logo Image -->
        <img :src="logo" alt="logo" class="w-40 object-contain shadow-sm" />
      </router-link>

      <!-- Menu -->
      <div>
        <h3 class="font-semibold text-gray-700 mb-3">Navigasi</h3>
        <ul class="space-y-2 text-sm text-gray-500">
          <li><router-link to="/" class="hover:text-blue-600">Home</router-link></li>
          <li><router-link to="/books" class="hover:text-blue-600">Buku</router-link></li>
          <li><router-link to="/keranjang" class="hover:text-blue-600">Keranjang</router-link></li>
        </ul>
      </div>

      <!-- Bantuan -->
      <div>
        <h3 class="font-semibold text-gray-700 mb-3">Bantuan</h3>
        <ul class="space-y-2 text-sm text-gray-500">
          <li><router-link to="/login" class="hover:text-blue-600">Login</router-link></li>
          <li><router-link to="/register" class="hover:text-blue-600">Daftar</router-link></li>
        </ul>
      </div>

      <!-- Kontak -->
      <div>
        <h3 class="font-semibold text-gray-700 mb-3">Kontak</h3>
        <p class="text-sm text-gray-500">📧 support@alkhairiyah.ac.id</p>
        <p class="text-sm text-gray-500 mt-1">📱 +62 812 3456 7890</p>
      </div>
    </div>

    <!-- Bottom -->
    <div class="relative border-t border-gray-100 text-center py-4 text-sm text-gray-400">
      © 2026 Bookstore Alkhairiyah. All rights reserved.
    </div>
  </footer>
</template>
