<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/lib/axios'
import logo from '@/assets/images/logo-nav.png'

const route = useRoute()

const books = ref([])
const search = ref('')
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const firstLoad = ref(true)
const selectedCategory = ref(route.query.category || null)

const sentinelEl = ref(null)
let observer = null
let searchTimer = null

const storageBase = import.meta.env.VITE_STORAGE_URL ?? '/storage'

function coverUrl(cover) {
  if (!cover) return null
  if (cover.startsWith('http')) return cover
  return `${storageBase}/${cover}`
}

async function fetchBooks(reset = false) {
  // ✅ FIX: guard hanya cek loading, tidak blok reset
  if (loading.value && !reset) return
  if (!reset && page.value > lastPage.value) return

  loading.value = true
  if (reset) firstLoad.value = true // ✅ set di sini, bukan di resetAndFetch

  try {
    const { data } = await api.get('/books', {
      params: {
        page: reset ? 1 : page.value,
        per_page: 12,
        search: search.value || undefined,
        category_id: selectedCategory.value || undefined,
      },
    })

    const items = Array.isArray(data.data) ? data.data : []

    if (reset) {
      books.value = items
      page.value = 2
    } else {
      books.value.push(...items)
      page.value++
    }

    lastPage.value = data.meta?.last_page ?? 1
  } catch (e) {
    console.error('API Error:', e.response?.data ?? e.message)
  } finally {
    loading.value = false
    firstLoad.value = false
  }
}

function setupObserver() {
  if (observer) observer.disconnect()
  observer = new IntersectionObserver(
    ([entry]) => {
      if (
        entry.isIntersecting &&
        !loading.value &&
        !firstLoad.value &&
        page.value <= lastPage.value
      ) {
        fetchBooks()
      }
    },
    { rootMargin: '100px' },
  )
  if (sentinelEl.value) observer.observe(sentinelEl.value)
}

function resetAndFetch() {
  // ✅ FIX: tidak set firstLoad di sini, biarkan fetchBooks yang handle
  books.value = []
  page.value = 1
  lastPage.value = 1
  fetchBooks(true)
}

watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => resetAndFetch(), 500)
})

watch(
  () => route.query.q,
  (newQ) => {
    const q = newQ ?? ''
    if (q !== search.value) search.value = q
  },
)

watch(
  () => route.query.category,
  (newVal) => {
    selectedCategory.value = newVal || null
    resetAndFetch()
  },
)

onMounted(async () => {
  if (route.query.q) search.value = route.query.q
  if (route.query.category) selectedCategory.value = route.query.category
  await fetchBooks(true)
  await nextTick()
  setupObserver()
})

onUnmounted(() => {
  observer?.disconnect()
  clearTimeout(searchTimer)
})

const hasMore = computed(() => page.value <= lastPage.value)
const isEmpty = computed(() => !loading.value && !firstLoad.value && books.value.length === 0)

// ✅ FIX: harga minimum yang aman dari NaN
function minPrice(book) {
  const prices = []
  if (book.has_print && book.price_print != null) prices.push(Number(book.price_print))
  if (book.has_pdf && book.price_pdf != null) prices.push(Number(book.price_pdf))
  return prices.length ? Math.min(...prices) : null
}
</script>

<template>
  <div class="relative overflow-hidden min-h-screen">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <div class="relative max-w-7xl mx-auto px-6 py-12">
      <!-- HEADER -->
      <div class="mb-8">
        <h1 class="text-3xl font-semibold text-gray-800 mb-1">Daftar Buku</h1>
        <p class="text-gray-400 text-sm">Temukan buku terbaik sesuai kebutuhanmu</p>
      </div>

      <!-- SEARCH -->
      <div class="mb-8 max-w-md">
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            v-model="search"
            type="text"
            placeholder="Cari judul atau penulis..."
            class="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-md text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition"
          />
          <button
            v-if="search"
            type="button"
            @click="search = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p v-if="!firstLoad && search" class="mt-2 text-xs text-gray-400 pl-1">
          Hasil untuk <span class="text-blue-500 font-medium">"{{ search }}"</span> ·
          {{ books.length }} buku
        </p>
      </div>

      <!-- SKELETON initial -->
      <div v-if="firstLoad" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div
          v-for="n in 8"
          :key="`sk-${n}`"
          class="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-sm"
        >
          <div class="skeleton h-40 rounded-xl mb-3"></div>
          <div class="skeleton h-3.5 rounded w-3/4 mb-2"></div>
          <div class="skeleton h-3 rounded w-1/2 mb-3"></div>
          <div class="skeleton h-4 rounded w-1/3"></div>
        </div>
      </div>

      <!-- ADA DATA -->
      <div v-else-if="books.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <router-link
          v-for="book in books"
          :key="book.id"
          :to="`/books/${book.id}`"
          class="group bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer block"
        >
          <div class="overflow-hidden rounded-xl bg-gray-100">
            <img
              v-if="coverUrl(book.cover)"
              :src="coverUrl(book.cover)"
              :alt="book.title"
              class="w-full h-40 object-cover rounded-xl group-hover:scale-105 transition duration-300"
              loading="lazy"
            />
            <div v-else class="w-full h-40 flex items-center justify-center text-4xl">📚</div>
          </div>

          <h2
            class="font-semibold text-gray-800 text-sm mt-3 line-clamp-2 group-hover:text-blue-600 transition"
          >
            {{ book.title }}
          </h2>
          <p class="text-gray-400 text-xs mt-1 line-clamp-1">{{ book.author }}</p>

          <!-- ✅ FIX: harga aman dari NaN -->
          <p class="text-blue-600 font-semibold mt-2 text-sm">
            <template v-if="minPrice(book) !== null">
              {{ book.has_print && book.has_pdf ? 'Mulai ' : '' }}Rp
              {{ minPrice(book).toLocaleString('id-ID') }}
            </template>
            <template v-else>-</template>
          </p>

          <!-- Badge tipe -->
          <div class="flex gap-1 mt-1.5 flex-wrap">
            <span
              v-if="book.has_print"
              class="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full font-semibold"
              >📦 Cetak</span
            >
            <span
              v-if="book.has_pdf"
              class="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-semibold"
              >💻 PDF</span
            >
          </div>

          <span class="mt-2 text-xs text-gray-400 group-hover:text-blue-500 transition block">
            Lihat Detail →
          </span>
        </router-link>

        <!-- Skeleton load-more -->
        <template v-if="loading">
          <div
            v-for="n in 4"
            :key="`more-${n}`"
            class="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-sm"
          >
            <div class="skeleton h-40 rounded-xl mb-3"></div>
            <div class="skeleton h-3.5 rounded w-3/4 mb-2"></div>
            <div class="skeleton h-3 rounded w-1/2 mb-3"></div>
            <div class="skeleton h-4 rounded w-1/3"></div>
          </div>
        </template>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="isEmpty" class="flex flex-col items-center justify-center text-center py-24">
        <div class="absolute w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-3xl"></div>
        <img
          :src="logo"
          alt="empty"
          class="w-28 h-28 object-contain opacity-80 mb-6 relative z-10"
        />
        <h2 class="text-lg font-semibold text-gray-700 relative z-10">Buku tidak ditemukan</h2>
        <p class="text-gray-400 text-sm mt-2 relative z-10">
          {{
            search
              ? `Tidak ada hasil untuk "${search}"`
              : 'Saat ini belum ada data buku yang tersedia'
          }}
        </p>
        <button
          v-if="search"
          type="button"
          @click="search = ''"
          class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition relative z-10"
        >
          Hapus Pencarian
        </button>
        <router-link
          v-else
          to="/"
          class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition relative z-10"
        >
          Kembali ke Home
        </router-link>
      </div>

      <!-- Sentinel -->
      <div ref="sentinelEl" class="h-4 mt-4"></div>

      <!-- End of list -->
      <div
        v-if="!hasMore && !loading && books.value > 0"
        class="text-center text-gray-400 text-sm py-8"
      >
        ✅ Semua buku sudah ditampilkan
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
