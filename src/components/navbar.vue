<script setup>
import { ref } from 'vue'
import logo from '@/assets/images/logo-nav.png'

import { MagnifyingGlassIcon, ShoppingCartIcon, Bars3Icon } from '@heroicons/vue/24/outline'

const isOpen = ref(false)
const isSearchOpen = ref(false)
const search = ref('')
</script>

<template>
  <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
    <!-- NAV -->
    <div class="max-w-7xl mx-auto px-6 py-3 flex items-center relative">
      <!-- LEFT -->
      <div class="md:hidden relative z-10">
        <button
          @click="isSearchOpen = !isSearchOpen"
          class="text-gray-500 hover:text-blue-600 transition"
        >
          <MagnifyingGlassIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- LOGO -->
      <router-link
        to="/"
        class="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center pointer-events-none"
      >
        <img :src="logo" alt="logo" class="w-36 md:w-40 object-contain pointer-events-auto" />
      </router-link>

      <!-- RIGHT -->
      <div class="ml-auto flex items-center gap-4">
        <!-- MOBILE -->
        <div class="md:hidden flex items-center gap-2">
          <!-- CART -->
          <router-link
            to="/keranjang"
            class="relative text-gray-500 hover:text-blue-600 transition"
          >
            <ShoppingCartIcon class="w-6 h-6" />
            <span
              class="absolute -top-2 -right-2 text-[10px] bg-blue-600 text-white px-1 rounded-full"
            >
              3
            </span>
          </router-link>
        </div>

        <!-- DESKTOP -->
        <div class="hidden md:flex items-center gap-8 text-sm font-medium">
          <router-link to="/" class="relative text-gray-600 hover:text-blue-600 group">
            Home
            <span
              class="absolute left-0 -bottom-1 w-0 h-[2px] bg-blue-600 transition-all group-hover:w-full"
            ></span>
          </router-link>

          <router-link to="/books" class="relative text-gray-600 hover:text-blue-600 group">
            Buku
            <span
              class="absolute left-0 -bottom-1 w-0 h-[2px] bg-blue-600 transition-all group-hover:w-full"
            ></span>
          </router-link>

          <!-- ICON -->
          <div class="flex items-center gap-4 ml-4">
            <button
              @click="isSearchOpen = !isSearchOpen"
              class="text-gray-500 hover:text-blue-600 transition"
            >
              <MagnifyingGlassIcon class="w-5 h-5" />
            </button>

            <router-link
              to="/keranjang"
              class="relative text-gray-500 hover:text-blue-600 transition"
            >
              <ShoppingCartIcon class="w-5 h-5" />
              <span
                class="absolute -top-2 -right-2 text-[10px] bg-blue-600 text-white px-1 rounded-full"
              >
                3
              </span>
            </router-link>
          </div>

          <!-- AUTH -->
          <router-link to="/login" class="text-gray-600 hover:text-blue-600 transition">
            Login
          </router-link>

          <router-link
            to="/register"
            class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-[1.05] transition"
          >
            Daftar
          </router-link>
        </div>

        <!-- MENU -->
        <button @click="isOpen = !isOpen" class="md:hidden text-gray-700">
          <Bars3Icon class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- SEARCH -->
    <div
      v-if="isSearchOpen"
      class="border-t border-gray-100 bg-white/80 backdrop-blur-md px-6 py-4"
    >
      <div class="max-w-7xl mx-auto">
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <MagnifyingGlassIcon class="w-5 h-5" />
          </span>

          <input
            v-model="search"
            type="text"
            placeholder="Cari buku..."
            autofocus
            class="w-full pl-12 pr-10 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />

          <button
            v-if="search.length > 0"
            @click="search = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- MOBILE MENU -->
    <div v-if="isOpen" class="md:hidden px-6 pb-5 space-y-4 border-t border-gray-100">
      <router-link to="/" class="block text-gray-600 hover:text-blue-600"> Home </router-link>

      <router-link to="/books" class="block text-gray-600 hover:text-blue-600"> Buku </router-link>

      <router-link
        to="/login"
        class="block px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-center hover:border-blue-600 hover:text-blue-600 transition"
      >
        Login
      </router-link>

      <router-link to="/register" class="block bg-blue-600 text-white text-center py-2 rounded-lg">
        Daftar
      </router-link>
    </div>
  </nav>
</template>
