<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'

const route = useRoute()
const router = useRouter()

const books = ref([])
const search = ref('')
const page = ref(1)
const lastPage = ref(1)
const loading = ref(false)
const firstLoad = ref(true)
const selectedCategory = ref(route.query.category || null)
const hasMore = computed(() => page.value <= lastPage.value)
const isEmpty = computed(() => !firstLoad.value && !loading.value && books.value.length === 0)
const sentinelEl = ref(null)
const categories = ref([])
const categoryContainer = ref(null)

function selectCategory(catId) {
  selectedCategory.value = catId
  resetAndFetch()
}

let observer = null
let searchTimer = null

const storageBase = import.meta.env.VITE_STORAGE_URL ?? '/storage'

function coverUrl(cover) {
  if (!cover) return null
  if (cover.startsWith('http')) return cover
  return `${storageBase}/${cover}`
}

const viewBookDetails = async (book) => {
  try {
    const { data } = await api.post(`/books/${book.id}`)
    if (data?.views !== undefined) {
      book.views = data.views
    }
  } catch (err) {
    console.error('Increment failed:', err.response?.data || err.message)
  } finally {
    router.push(`/books/${book.id}`)
  }
}

function scrollLeft() {
  categoryContainer.value.scrollBy({ left: -200, behavior: 'smooth' })
}

function scrollRight() {
  categoryContainer.value.scrollBy({ left: 200, behavior: 'smooth' })
}

async function fetchCategories() {
  try {
    const { data } = await api.get('/categories')
    categories.value = data
  } catch (e) {
    console.error('Error fetching categories', e)
  }
}

async function fetchBooks(reset = false) {
  if (loading.value && !reset) return
  if (!reset && page.value > lastPage.value) return

  loading.value = true
  if (reset) firstLoad.value = true

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
  fetchCategories()
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

const minPrice = (book) => {
  const prices = []
  if (book.has_print && book.price_print != null) prices.push(Number(book.price_print))
  if (book.has_pdf && book.price_pdf != null) prices.push(Number(book.price_pdf))
  return prices.length ? Math.min(...prices) : null
}
</script>

<template>
  <div class="relative overflow-hidden min-h-screen">
    <!-- ✅ Background: Grid + Glow + Animated Shine (sama seperti Login) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <!-- Grid lines -->
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.12)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>
      <!-- Center glow -->
      <div class="absolute inset-0 flex justify-center items-center">
        <div class="w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl"></div>
      </div>
      <!-- Animated shine sweep -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent animate-shine"
      ></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <!-- HEADER -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-semibold text-gray-800 mb-1">Daftar Buku</h1>
        <p class="text-gray-400 text-sm">Temukan buku terbaik sesuai kebutuhanmu</p>
      </div>

      <!-- SEARCH -->
      <div class="mb-8 max-w-xxl">
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
        <p v-if="!firstLoad && search && !isEmpty" class="mt-2 text-xs text-gray-400 pl-1">
          Hasil untuk <span class="text-blue-500 font-medium">"{{ search }}"</span> ·
          {{ books.length }} buku ditemukan
        </p>
      </div>

      <!-- CATEGORY CAROUSEL -->
      <div class="relative mb-6">
        <!-- Left button -->
        <button
          @click="scrollLeft"
          class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 backdrop-blur-md w-8 h-8 flex items-center justify-center rounded-full shadow hover:bg-blue-100 transition text-blue-600 font-bold"
        >
          ‹
        </button>

        <!-- Scroll container -->
        <div ref="categoryContainer" class="flex gap-3 overflow-x-auto scrollbar-hide px-8">
          <!-- Semua kategori -->
          <div
            @click="selectCategory(null)"
            :class="[
              'flex-shrink-0 cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition',
              selectedCategory === null
                ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                : 'bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 hover:bg-blue-50',
            ]"
          >
            Semua
          </div>

          <div
            v-for="cat in categories"
            :key="cat.id"
            @click="selectCategory(cat.id)"
            :class="[
              'flex-shrink-0 cursor-pointer px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition',
              selectedCategory == cat.id
                ? 'bg-blue-500 text-white shadow-md shadow-blue-200'
                : 'bg-white/80 backdrop-blur-md border border-blue-100 text-blue-700 hover:bg-blue-50',
            ]"
          >
            {{ cat.name }}
          </div>
        </div>

        <!-- Right button -->
        <button
          @click="scrollRight"
          class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/70 backdrop-blur-md w-8 h-8 flex items-center justify-center rounded-full shadow hover:bg-blue-100 transition text-blue-600 font-bold"
        >
          ›
        </button>
      </div>

      <!-- SKELETON -->
      <!-- SKELETON -->
      <div v-if="firstLoad" class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div v-for="n in 8" :key="`sk-${n}`" class="rounded-2xl p-4">
          <div class="skeleton h-48 rounded-xl mb-3"></div>
          <div class="skeleton h-3.5 rounded w-3/4 mb-2"></div>
          <div class="skeleton h-3 rounded w-1/2 mb-3"></div>
          <div class="skeleton h-4 rounded w-1/3 mb-2"></div>
          <div class="skeleton h-3 rounded w-1/4"></div>
        </div>
      </div>

      <!-- ADA DATA -->
      <div v-else-if="books.length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="book in books"
          :key="book.id"
          class="group bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
          @click="viewBookDetails(book)"
        >
          <div class="overflow-hidden rounded-xl bg-gray-100 mb-4">
            <img
              v-if="coverUrl(book.cover)"
              :src="coverUrl(book.cover)"
              :alt="book.title"
              class="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition duration-300"
              loading="lazy"
            />
            <div v-else class="w-full h-48 flex items-center justify-center text-4xl">📚</div>
          </div>

          <h2
            class="font-semibold text-gray-800 text-sm md:text-base mt-3 line-clamp-2 group-hover:text-blue-600 transition"
          >
            {{ book.title }}
          </h2>
          <p class="text-gray-400 text-xs md:text-sm mt-1 line-clamp-1">{{ book.author }}</p>

          <p class="text-blue-600 font-semibold mt-2 text-sm md:text-base">
            <template v-if="minPrice(book) !== null">
              {{ book.has_print && book.has_pdf ? 'Mulai ' : '' }}Rp
              {{ minPrice(book).toLocaleString('id-ID') }}
            </template>
            <template v-else>-</template>
          </p>

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

          <p class="mt-3 text-[11px] md:text-xs text-gray-500 flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {{ book.views || 0 }} Dilihat
          </p>

          <span class="mt-2 text-xs text-gray-400 group-hover:text-blue-500 transition block">
            Lihat Detail →
          </span>
        </div>
      </div>

      <!-- ======================== EMPTY STATE ======================== -->
      <div
        v-else-if="isEmpty"
        class="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4"
      >
        <div class="relative mb-6 sm:mb-8">
          <div class="absolute inset-0 flex items-center justify-center">
            <div
              class="w-40 h-40 sm:w-56 sm:h-56 bg-blue-100 rounded-full blur-3xl opacity-60"
            ></div>
          </div>
          <svg
            class="relative w-36 h-36 sm:w-52 sm:h-52 mx-auto"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="45" y="70" width="70" height="90" rx="6" fill="#DBEAFE" />
            <rect x="45" y="70" width="8" height="90" rx="3" fill="#93C5FD" />
            <rect
              x="58"
              y="55"
              width="75"
              height="98"
              rx="7"
              fill="#EFF6FF"
              stroke="#BFDBFE"
              stroke-width="1.5"
            />
            <rect x="58" y="55" width="10" height="98" rx="4" fill="#60A5FA" />
            <rect x="76" y="75" width="42" height="5" rx="2.5" fill="#BFDBFE" />
            <rect x="76" y="87" width="34" height="4" rx="2" fill="#DBEAFE" />
            <rect x="76" y="98" width="38" height="4" rx="2" fill="#DBEAFE" />
            <rect x="76" y="109" width="28" height="4" rx="2" fill="#DBEAFE" />
            <circle cx="130" cy="125" r="28" fill="white" stroke="#93C5FD" stroke-width="3" />
            <circle cx="130" cy="125" r="20" fill="#F0F9FF" />
            <text
              x="124"
              y="132"
              font-size="20"
              font-weight="700"
              fill="#60A5FA"
              font-family="Arial"
            >
              ?
            </text>
            <line
              x1="151"
              y1="146"
              x2="164"
              y2="160"
              stroke="#93C5FD"
              stroke-width="5"
              stroke-linecap="round"
            />
            <circle cx="52" cy="52" r="4" fill="#FCD34D" opacity="0.7" />
            <circle cx="165" cy="75" r="3" fill="#A5B4FC" opacity="0.8" />
            <circle cx="40" cy="140" r="2.5" fill="#6EE7B7" opacity="0.7" />
          </svg>
        </div>

        <div class="relative z-10 max-w-sm sm:max-w-md mx-auto">
          <h2 class="text-lg sm:text-xl font-bold text-gray-700 mb-2">
            {{ search ? 'Buku Tidak Ditemukan' : 'Belum Ada Buku' }}
          </h2>

          <div
            class="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-2xl px-4 py-3.5 mt-3 text-left"
            role="alert"
          >
            <svg
              class="w-5 h-5 mt-0.5 shrink-0 text-blue-500"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <div>
              <p class="text-sm font-semibold leading-snug">
                {{
                  search
                    ? `Tidak ada buku yang cocok dengan "${search}"`
                    : 'Koleksi buku belum tersedia saat ini'
                }}
              </p>
              <p class="text-xs text-blue-500 mt-1 leading-relaxed">
                {{
                  search
                    ? 'Coba gunakan kata kunci lain atau periksa ejaan pencarian kamu.'
                    : 'Silakan kunjungi kembali nanti. Koleksi akan segera diperbarui.'
                }}
              </p>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              v-if="search"
              type="button"
              @click="search = ''"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md shadow-blue-200"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Hapus Pencarian
            </button>

            <router-link
              v-else
              to="/"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 active:scale-95 transition-all duration-200 shadow-md shadow-blue-200"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Kembali ke Home
            </router-link>

            <button
              type="button"
              @click="resetAndFetch()"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-blue-600 text-sm font-semibold rounded-full border border-blue-200 hover:bg-blue-50 active:scale-95 transition-all duration-200"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
      <!-- ======================== END EMPTY STATE ======================== -->

      <!-- Sentinel infinite scroll -->
      <div ref="sentinelEl" class="h-4 mt-4"></div>

      <!-- End of list -->
      <div
        v-if="!hasMore && !loading && books.length > 0"
        class="text-center text-gray-400 text-sm py-8"
      >
        ✅ Semua buku sudah ditampilkan
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.skeleton {
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0.08) 25%,
    rgba(59, 130, 246, 0.18) 50%,
    rgba(59, 130, 246, 0.08) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.5rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ✅ Animated shine — identik dengan Login */
@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
.animate-shine {
  animation: shine 6s linear infinite;
}
</style>
