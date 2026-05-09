<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import axios from 'axios'
import logo from '@/assets/images/logo-nav.png'
import {
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  Bars3Icon,
  UserCircleIcon,
  ChevronDownIcon,
} from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/auth'

const router = useRouter()
const { isLoggedIn, user, clearAuth } = useAuth()

const isOpen = ref(false)
const isSearchOpen = ref(false)
const isProfileOpen = ref(false)
const isMobileProfileOpen = ref(false)
const search = ref('')
const cartCount = ref(0)

const userInitial = computed(() => {
  return user.value?.name?.charAt(0)?.toUpperCase() || '?'
})

const fetchCartCount = async () => {
  if (!isLoggedIn.value) {
    cartCount.value = 0
    return
  }
  try {
    const { data } = await axios.get('/api/cart/count')
    cartCount.value = data.count ?? 0
  } catch {
    cartCount.value = 0
  }
}

function onCartUpdated() {
  fetchCartCount()
}

const handleLogout = async () => {
  try {
    await axios.post('/api/logout') // ✅ pakai axios global, tidak perlu hardcode URL + header manual
  } catch (e) {
  } finally {
    clearAuth()
    cartCount.value = 0
    isProfileOpen.value = false
    isMobileProfileOpen.value = false
    isOpen.value = false
    router.push('/login')
  }
}

const closeProfile = (e) => {
  if (!e.target.closest('#profile-menu') && !e.target.closest('#mobile-profile-menu')) {
    isProfileOpen.value = false
    isMobileProfileOpen.value = false
  }
}

function handleSearch() {
  if (!search.value.trim()) return
  isSearchOpen.value = false
  router.push({ path: '/books', query: { q: search.value.trim() } })
  search.value = ''
}

// ✅ Satu onMounted dan onUnmounted saja
onMounted(() => {
  fetchCartCount()
  document.addEventListener('click', closeProfile)
  window.addEventListener('cart-updated', onCartUpdated)
})

onUnmounted(() => {
  document.removeEventListener('click', closeProfile)
  window.removeEventListener('cart-updated', onCartUpdated)
})
</script>

<template>
  <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
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
          <router-link
            to="/keranjang"
            class="relative text-gray-500 hover:text-blue-600 transition"
          >
            <ShoppingCartIcon class="w-6 h-6" />
            <span
              v-if="cartCount > 0"
              class="absolute -top-2 -right-2 text-[10px] bg-blue-600 text-white px-1 rounded-full"
            >
              {{ cartCount > 99 ? '99+' : cartCount }}
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

          <!-- ICONS -->
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
              <ShoppingCartIcon class="w-6 h-6" />
              <span
                v-if="cartCount > 0"
                class="absolute -top-2 -right-2 text-[10px] bg-blue-600 text-white px-1 rounded-full"
              >
                {{ cartCount > 99 ? '99+' : cartCount }}
              </span>
            </router-link>
          </div>

          <!-- ─── BELUM LOGIN ─── -->
          <template v-if="!isLoggedIn">
            <router-link to="/login" class="text-gray-600 hover:text-blue-600 transition">
              Login
            </router-link>
            <router-link
              to="/register"
              class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-[1.05] transition"
            >
              Daftar
            </router-link>
          </template>

          <!-- ─── SUDAH LOGIN — AVATAR DROPDOWN ─── -->
          <div v-else id="profile-menu" class="relative">
            <button
              @click.stop="isProfileOpen = !isProfileOpen"
              class="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200 transition"
            >
              <!-- Avatar inisial -->
              <div
                class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold"
              >
                {{ userInitial }}
              </div>
              <div class="text-left hidden lg:block">
                <p class="text-sm font-medium text-gray-800 leading-none">{{ user?.name }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ user?.email }}</p>
              </div>
              <ChevronDownIcon
                class="w-4 h-4 text-gray-400 transition"
                :class="{ 'rotate-180': isProfileOpen }"
              />
            </button>

            <!-- Dropdown -->
            <div
              v-if="isProfileOpen"
              class="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
            >
              <!-- Info user -->
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-sm font-semibold text-gray-800">{{ user?.name }}</p>
                <p class="text-xs text-gray-400 truncate">{{ user?.email }}</p>
                <p class="text-xs text-gray-400">NIM: {{ user?.nim }}</p>
              </div>

              <!-- Menu -->
              <router-link
                to="/profile"
                @click="isProfileOpen = false"
                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
              >
                <UserCircleIcon class="w-4 h-4" /> Profil Saya
              </router-link>

              <router-link
                to="/orders"
                @click="isProfileOpen = false"
                class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
              >
                📦 Pesanan Saya
              </router-link>

              <div class="border-t border-gray-100 mt-1 pt-1">
                <button
                  @click="handleLogout"
                  class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
                >
                  🚪 Keluar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- HAMBURGER -->
        <button @click="isOpen = !isOpen" class="md:hidden text-gray-700">
          <Bars3Icon class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- SEARCH BAR -->
    <div
      v-if="isSearchOpen"
      class="border-t border-gray-100 bg-white/80 backdrop-blur-md px-6 py-4"
    >
      <div class="max-w-7xl mx-auto">
        <div class="relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <MagnifyingGlassIcon class="w-5 h-5" />
          </span>
          <!-- update input di template navbar -->
          <input
            v-model="search"
            type="text"
            placeholder="Cari buku..."
            autofocus
            @keyup.enter="handleSearch"
            class="w-full pl-12 pr-10 py-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
          />
          <!-- tambah tombol search -->
          <button
            @click="handleSearch"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500"
          >
            <MagnifyingGlassIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- MOBILE MENU -->
    <div v-if="isOpen" class="md:hidden px-6 pb-5 space-y-4 border-t border-gray-100">
      <router-link to="/" class="block text-gray-600 hover:text-blue-600">Home</router-link>
      <router-link to="/books" class="block text-gray-600 hover:text-blue-600">Buku</router-link>

      <!-- Mobile — belum login -->
      <template v-if="!isLoggedIn">
        <router-link
          to="/login"
          class="block px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-center hover:border-blue-600 hover:text-blue-600 transition"
        >
          Login
        </router-link>
        <router-link
          to="/register"
          class="block bg-blue-600 text-white text-center py-2 rounded-lg"
        >
          Daftar
        </router-link>
      </template>

      <!-- Mobile — sudah login -->
      <!-- Mobile — sudah login -->
      <template v-else>
        <!-- Tombol avatar mobile — sama seperti desktop -->
        <div id="mobile-profile-menu" class="relative">
          <button
            @click.stop="isMobileProfileOpen = !isMobileProfileOpen"
            class="flex items-center gap-2 w-full hover:bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 transition"
          >
            <div
              class="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold"
            >
              {{ userInitial }}
            </div>
            <div class="text-left flex-1">
              <p class="text-sm font-medium text-gray-800 leading-none">{{ user?.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ user?.email }}</p>
            </div>
            <ChevronDownIcon
              class="w-4 h-4 text-gray-400 transition"
              :class="{ 'rotate-180': isMobileProfileOpen }"
            />
          </button>

          <!-- Dropdown mobile -->
          <div
            v-if="isMobileProfileOpen"
            class="mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 py-2"
          >
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-semibold text-gray-800">{{ user?.name }}</p>
              <p class="text-xs text-gray-400 truncate">{{ user?.email }}</p>
              <p class="text-xs text-gray-400">NIM: {{ user?.nim }}</p>
            </div>

            <router-link
              to="/profil"
              @click="closeMobileMenu"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
            >
              <UserCircleIcon class="w-4 h-4" /> Profil Saya
            </router-link>

            <router-link
              to="/orders"
              @click="closeMobileMenu"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
            >
              📦 Pesanan Saya
            </router-link>

            <div class="border-t border-gray-100 mt-1 pt-1">
              <button
                @click="handleLogout"
                class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
              >
                🚪 Keluar
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </nav>
</template>
