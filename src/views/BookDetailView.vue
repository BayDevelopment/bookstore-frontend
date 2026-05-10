<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import Swal from 'sweetalert2'
import DOMPurify from 'dompurify'

const route = useRoute()
const router = useRouter()

const book = ref(null)
const loading = ref(true)
const error = ref(null)
const showLoginAlert = ref(false)
const addedToCart = ref(false)
const cartLoading = ref(false)

const selectedType = ref(null)

const token = ref(localStorage.getItem('token'))
const isLoggedIn = computed(() => !!token.value)

function onStorageChange(e) {
  if (e.key === 'token') token.value = e.newValue
}

let addedTimer = null
// ✅ FIX: flag untuk cegah double-fetch yang benar
let isFetching = false

onMounted(() => {
  window.addEventListener('storage', onStorageChange)
  fetchDetail()
})

onUnmounted(() => {
  window.removeEventListener('storage', onStorageChange)
  clearTimeout(addedTimer)
})

async function fetchDetail() {
  // ✅ FIX: guard pakai flag terpisah, bukan kombinasi loading+book
  if (isFetching) return
  isFetching = true
  loading.value = true
  error.value = null
  try {
    const { data } = await api.get(`/books/${route.params.id}`)
    book.value = data.data ?? data

    if (book.value.has_print) selectedType.value = 'print'
    else if (book.value.has_pdf) selectedType.value = 'pdf'
  } catch (e) {
    error.value = e.response?.status === 404 ? 'Buku tidak ditemukan.' : 'Gagal memuat data.'
  } finally {
    loading.value = false
    isFetching = false
  }
}

const selectedPrice = computed(() => {
  if (!book.value) return 0
  if (selectedType.value === 'print') return Number(book.value.price_print ?? 0)
  if (selectedType.value === 'pdf') return Number(book.value.price_pdf ?? 0)
  return 0
})

const stokLabel = computed(() => {
  if (selectedType.value === 'pdf') {
    return { text: 'Digital — Selalu Tersedia', cls: 'bg-blue-100 text-blue-600' }
  }
  const s = book.value?.stock ?? 0
  if (s === 0) return { text: 'Stok Habis', cls: 'bg-red-100 text-red-600' }
  if (s <= 5) return { text: `Sisa ${s} buku`, cls: 'bg-orange-100 text-orange-600' }
  return { text: `${s} tersedia`, cls: 'bg-green-100 text-green-600' }
})

const canBuy = computed(() => {
  if (!selectedType.value) return false
  if (selectedType.value === 'pdf') return true
  return (book.value?.stock ?? 0) > 0
})

const storageBase = import.meta.env.VITE_STORAGE_URL ?? '/storage'

const coverSrc = computed(() => {
  if (!book.value?.cover) return null
  if (book.value.cover.startsWith('http')) return book.value.cover
  return `${storageBase}/${book.value.cover}`
})

const safeDescription = computed(() => {
  if (!book.value?.description) return 'Tidak ada deskripsi.'
  return DOMPurify.sanitize(book.value.description)
})

async function handleKeranjang() {
  if (!isLoggedIn.value) {
    showLoginAlert.value = true
    return
  }
  if (!selectedType.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Pilih tipe buku terlebih dahulu',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
    return
  }
  cartLoading.value = true
  try {
    await api.post('/cart', { book_id: book.value.id, quantity: 1, type: selectedType.value })
    Swal.fire({
      icon: 'success',
      title: 'Berhasil!',
      text: `"${book.value.title}" masuk keranjang`,
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
    clearTimeout(addedTimer)
    addedToCart.value = true
    addedTimer = setTimeout(() => (addedToCart.value = false), 2000)
    window.dispatchEvent(new Event('cart-updated'))
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'Gagal!',
      text: e.response?.data?.message ?? 'Gagal menambahkan ke keranjang',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
  } finally {
    cartLoading.value = false
  }
}

function handleBeli() {
  if (!isLoggedIn.value) {
    showLoginAlert.value = true
    return
  }
  if (!selectedType.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Pilih tipe buku terlebih dahulu',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    })
    return
  }
  router.push({ path: '/checkout', query: { book_id: book.value.id, type: selectedType.value } })
}

function goToLogin() {
  showLoginAlert.value = false
  router.push('/login')
}
function goToRegister() {
  showLoginAlert.value = false
  router.push('/register')
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <!-- MODAL Login -->
    <Transition name="fade">
      <div
        v-if="showLoginAlert"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
        @click.self="showLoginAlert = false"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-pop"
        >
          <div
            class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-gray-800 mb-1">Login Diperlukan</h2>
          <p class="text-sm text-gray-500 mb-6">
            Kamu harus <span class="font-medium text-gray-700">login</span> terlebih dahulu untuk
            membeli buku ini.
          </p>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              @click="goToLogin"
              class="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
            >
              🔑 Login Sekarang
            </button>
            <button
              type="button"
              @click="goToRegister"
              class="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-100 transition"
            >
              📝 Daftar Akun Baru
            </button>
            <button
              type="button"
              @click="showLoginAlert = false"
              class="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition"
            >
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- BACK -->
    <div class="relative max-w-5xl mx-auto px-6 pt-8">
      <button
        type="button"
        @click="router.back()"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition group"
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
        Kembali ke Daftar Buku
      </button>
    </div>

    <!-- SKELETON -->
    <div v-if="loading" class="relative max-w-5xl mx-auto px-6 py-8">
      <div class="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-sm p-8">
        <div class="flex flex-col md:flex-row gap-10">
          <div class="skeleton w-full md:w-56 h-80 rounded-2xl shrink-0"></div>
          <div class="flex-1 space-y-4 pt-2">
            <div class="skeleton h-8 rounded w-3/4"></div>
            <div class="skeleton h-4 rounded w-1/2"></div>
            <div class="skeleton h-6 rounded w-1/4 mt-4"></div>
            <div class="space-y-2 mt-6">
              <div class="skeleton h-3 rounded w-full"></div>
              <div class="skeleton h-3 rounded w-full"></div>
              <div class="skeleton h-3 rounded w-5/6"></div>
            </div>
            <div class="skeleton h-12 rounded-xl w-48 mt-8"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ERROR -->
    <div
      v-else-if="error"
      class="relative max-w-5xl mx-auto px-6 py-24 flex flex-col items-center text-center"
    >
      <p class="text-5xl mb-4">📭</p>
      <h2 class="text-lg font-semibold text-gray-700">{{ error }}</h2>
      <button
        type="button"
        @click="router.back()"
        class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
      >
        Kembali
      </button>
    </div>

    <!-- DETAIL BUKU -->
    <div v-else-if="book" class="relative max-w-5xl mx-auto px-6 py-8 pb-16">
      <div
        class="bg-white/80 backdrop-blur-md rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div class="h-1.5 w-full bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500"></div>
        <div class="p-8 flex flex-col md:flex-row gap-10">
          <!-- COVER -->
          <div class="shrink-0 w-full md:w-56">
            <div class="rounded-2xl overflow-hidden shadow-lg aspect-[3/4] bg-gray-100">
              <img
                v-if="coverSrc"
                :src="coverSrc"
                :alt="book.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-6xl">📚</div>
            </div>
            <div class="mt-3 text-center">
              <span
                :class="[
                  'inline-block px-3 py-1 rounded-full text-xs font-semibold',
                  stokLabel.cls,
                ]"
              >
                {{ stokLabel.text }}
              </span>
            </div>
          </div>

          <!-- INFO -->
          <div class="flex-1 flex flex-col">
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-1">
              {{ book.title }}
            </h1>
            <p class="text-gray-500 text-sm mb-4">
              oleh <span class="text-gray-700 font-medium">{{ book.author }}</span>
            </p>

            <!-- PILIH TIPE -->
            <div class="mb-5">
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Pilih Tipe
              </p>
              <div class="flex gap-3 flex-wrap">
                <button
                  v-if="book.has_print"
                  type="button"
                  @click="selectedType = 'print'"
                  :class="[
                    'px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                    selectedType === 'print'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300',
                  ]"
                >
                  📦 Cetak — Rp {{ Number(book.price_print).toLocaleString('id-ID') }}
                </button>
                <button
                  v-if="book.has_pdf"
                  type="button"
                  @click="selectedType = 'pdf'"
                  :class="[
                    'px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                    selectedType === 'pdf'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300',
                  ]"
                >
                  💻 PDF Digital — Rp {{ Number(book.price_pdf).toLocaleString('id-ID') }}
                </button>
              </div>
            </div>

            <!-- Harga -->
            <p class="text-blue-600 text-2xl font-bold mb-6">
              Rp {{ selectedPrice.toLocaleString('id-ID') }}
            </p>

            <hr class="border-gray-100 mb-6" />

            <!-- Deskripsi -->
            <div class="mb-6">
              <h2 class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">
                Deskripsi
              </h2>
              <div
                class="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
                v-html="safeDescription"
              ></div>
            </div>

            <!-- Info Grid -->
            <div class="grid grid-cols-2 gap-3 mb-8">
              <div class="bg-gray-50 rounded-xl px-4 py-3">
                <p class="text-xs text-gray-400 mb-0.5">Stok Cetak</p>
                <p class="text-sm font-semibold text-gray-700">
                  {{ book.has_print ? `${book.stock} buku` : '-' }}
                </p>
              </div>
              <div class="bg-gray-50 rounded-xl px-4 py-3">
                <p class="text-xs text-gray-400 mb-0.5">PDF Digital</p>
                <p class="text-sm font-semibold text-gray-700">
                  {{ book.has_pdf ? '✅ Tersedia' : '❌ Tidak Ada' }}
                </p>
              </div>
            </div>

            <!-- CTA -->
            <div class="mt-auto flex items-center gap-3 flex-wrap">
              <button
                type="button"
                @click="handleBeli"
                :disabled="!canBuy"
                :class="[
                  'px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2',
                  !canBuy
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95',
                ]"
              >
                {{ !canBuy ? 'Stok Habis' : '🛒 Beli Sekarang' }}
              </button>

              <button
                type="button"
                @click="handleKeranjang"
                :disabled="!canBuy || cartLoading"
                :class="[
                  'px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 border',
                  !canBuy
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : cartLoading
                      ? 'border-blue-200 bg-blue-50 text-blue-400 cursor-wait'
                      : addedToCart
                        ? 'border-green-400 bg-green-50 text-green-600'
                        : 'border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 active:scale-95',
                ]"
              >
                <svg
                  v-if="cartLoading"
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span v-else>{{ addedToCart ? '✅' : '🧺' }}</span>
                {{ cartLoading ? 'Menambahkan...' : addedToCart ? 'Ditambahkan!' : 'Keranjang' }}
              </button>

              <p v-if="!isLoggedIn" class="text-xs text-gray-400 flex items-center gap-1">
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4m0 4h.01" />
                </svg>
                Login diperlukan untuk membeli
              </p>
            </div>
          </div>
        </div>
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
    rgba(59, 130, 246, 0.1) 40%,
    rgba(59, 130, 246, 0.2) 50%,
    rgba(59, 130, 246, 0.1) 60%,
    transparent 100%
  );
  animation: shimmer 10s linear infinite;
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.animate-pop {
  animation: pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
