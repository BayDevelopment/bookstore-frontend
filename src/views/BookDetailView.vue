<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const book = ref(null)
const loading = ref(true)
const error = ref(null)
const showLoginAlert = ref(false)

const isLoggedIn = computed(() => !!localStorage.getItem('token'))

async function fetchDetail() {
  loading.value = true
  error.value = null
  try {
    const { data } = await axios.get(`/api/books/${route.params.id}`)
    book.value = data.data ?? data
  } catch (e) {
    error.value = e.response?.status === 404 ? 'Buku tidak ditemukan.' : 'Gagal memuat data.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchDetail)

const coverSrc = computed(() => {
  if (!book.value?.cover) return null
  if (book.value.cover.startsWith('http')) return book.value.cover
  return `/storage/${book.value.cover}`
})

const stokLabel = computed(() => {
  const s = book.value?.stock ?? 0
  if (s === 0) return { text: 'Stok Habis', cls: 'bg-red-100 text-red-600' }
  if (s <= 5) return { text: `Sisa ${s} buku`, cls: 'bg-orange-100 text-orange-600' }
  return { text: `${s} tersedia`, cls: 'bg-green-100 text-green-600' }
})

function handleBeli() {
  if (!isLoggedIn.value) {
    showLoginAlert.value = true
    return
  }
  // Navigate ke halaman checkout dengan book_id
  router.push({ path: '/checkout', query: { book_id: book.value.id } })
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

    <!-- MODAL — Harus Login -->
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
            membeli buku ini. Belum punya akun?
            <span class="text-blue-600 font-medium">Daftar sekarang!</span>
          </p>
          <div class="flex flex-col gap-2">
            <button
              @click="goToLogin"
              class="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 active:scale-95 transition-all"
            >
              🔑 Login Sekarang
            </button>
            <button
              @click="goToRegister"
              class="w-full py-2.5 bg-blue-50 text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-100 active:scale-95 transition-all"
            >
              📝 Daftar Akun Baru
            </button>
            <button
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
                >{{ stokLabel.text }}</span
              >
            </div>
          </div>

          <!-- INFO -->
          <div class="flex-1 flex flex-col">
            <div class="flex gap-2 mb-3">
              <span
                class="px-2.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium capitalize"
                >{{ book.type }}</span
              >
            </div>
            <h1 class="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-1">
              {{ book.title }}
            </h1>
            <p class="text-gray-500 text-sm mb-4">
              oleh <span class="text-gray-700 font-medium">{{ book.author }}</span>
            </p>
            <p class="text-blue-600 text-2xl font-bold mb-6">
              Rp {{ Number(book.price).toLocaleString('id-ID') }}
            </p>
            <hr class="border-gray-100 mb-6" />
            <div class="mb-6">
              <h2 class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">
                Deskripsi
              </h2>
              <div
                class="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
                v-html="book.description ?? 'Tidak ada deskripsi.'"
              ></div>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-8">
              <div class="bg-gray-50 rounded-xl px-4 py-3">
                <p class="text-xs text-gray-400 mb-0.5">Stok</p>
                <p class="text-sm font-semibold text-gray-700">{{ book.stock }} buku</p>
              </div>
              <div class="bg-gray-50 rounded-xl px-4 py-3">
                <p class="text-xs text-gray-400 mb-0.5">Tipe</p>
                <p class="text-sm font-semibold text-gray-700 capitalize">{{ book.type }}</p>
              </div>
            </div>

            <!-- TOMBOL BELI -->
            <div class="mt-auto flex items-center gap-3 flex-wrap">
              <button
                @click="handleBeli"
                :disabled="book.stock === 0"
                :class="[
                  'px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2',
                  book.stock === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
                ]"
              >
                {{ book.stock === 0 ? 'Stok Habis' : '🛒 Beli Buku' }}
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
