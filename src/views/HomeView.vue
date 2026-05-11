<script setup>
import { ref, onMounted } from 'vue'
import {
  BookOpenIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  BeakerIcon,
  BriefcaseIcon,
  ScaleIcon,
  InboxIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import api from '@/lib/axios'

const iconList = {
  BookOpenIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  BeakerIcon,
  BriefcaseIcon,
  ScaleIcon,
  InboxIcon,
  CodeBracketIcon,
}

const categories = ref([])
const loading = ref(true)
const error = ref(false)

const resolveIcon = (iconName) => {
  return iconList[iconName] || BookOpenIcon
}

const fetchCategories = async (retryCount = 3) => {
  error.value = false
  loading.value = true

  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await api.get('/categories')
      categories.value = response.data.data || response.data
      loading.value = false
      return
    } catch (e) {
      console.error(`Attempt ${i + 1} gagal:`, e)
      if (i < retryCount - 1) {
        await new Promise((res) => setTimeout(res, 1000 * (i + 1)))
      }
    }
  }

  error.value = true
  loading.value = false
}

onMounted(() => fetchCategories())
</script>

<template>
  <div class="bg-gray-50 min-h-screen" lang="id">
    <!-- HERO SECTION -->
    <section class="relative overflow-hidden bg-white border-b border-gray-100">
      <div class="absolute inset-0 pointer-events-none grid-wave"></div>
      <div
        class="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 grid md:grid-cols-2 gap-8 md:gap-10 items-center"
      >
        <div class="z-10 text-center md:text-left">
          <h1
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-3 sm:mb-4"
          >
            <span class="text-blue-600">BookStore</span> Unival
          </h1>
          <p class="text-base sm:text-lg text-gray-500 mb-6 sm:mb-8 max-w-lg mx-auto md:mx-0">
            Temukan buku digital & cetak terbaik untuk menunjang pembelajaranmu di setiap fakultas.
          </p>
          <div class="flex gap-3 sm:gap-4 flex-wrap justify-center md:justify-start">
            <router-link
              to="/books"
              class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full shadow-md hover:shadow-blue-200 hover:bg-blue-700 transition-all duration-300 text-sm sm:text-base"
            >
              <BookOpenIcon class="w-4 h-4 sm:w-5 sm:h-5" />
              <span class="font-medium">Jelajahi Buku</span>
            </router-link>
            <router-link
              to="/register"
              class="inline-flex items-center gap-2 border border-gray-200 bg-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:shadow-sm transition-all duration-300 text-sm sm:text-base"
            >
              <RocketLaunchIcon class="w-4 h-4 sm:w-5 sm:h-5" />
              <span class="font-medium">Mulai Sekarang</span>
            </router-link>
          </div>
        </div>
        <div class="flex justify-center relative">
          <div
            class="absolute w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] bg-blue-400/20 rounded-full blur-3xl animate-pulse"
          ></div>
          <AcademicCapIcon
            class="relative z-10 w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 text-blue-600 animate-float"
          />
        </div>
      </div>
    </section>

    <!-- KATEGORI SECTION -->
    <section class="py-10 sm:py-16 md:py-24 px-3 sm:px-6 relative overflow-hidden bg-white">
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          class="absolute -top-20 -left-20 w-72 sm:w-96 h-72 sm:h-96 bg-blue-100/40 rounded-full blur-[100px] animate-float"
        ></div>
        <div
          class="absolute top-1/4 -right-20 w-64 sm:w-[30rem] h-64 sm:h-[30rem] bg-indigo-50/50 rounded-full blur-[120px] animate-float-delayed"
        ></div>
        <div
          class="absolute -bottom-32 left-1/3 w-72 sm:w-[40rem] h-72 sm:h-[40rem] bg-blue-50/60 rounded-full blur-[130px] animate-float"
        ></div>
        <div
          class="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"
        ></div>
      </div>

      <div class="relative max-w-6xl mx-auto">
        <div class="text-center mb-8 sm:mb-12 md:mb-20 animate-fade-in-up">
          <h2
            class="text-2xl sm:text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 sm:mb-6 tracking-tight"
          >
            Kategori Fakultas
          </h2>
          <div class="w-14 sm:w-24 h-1 sm:h-2 bg-blue-600 mx-auto rounded-full mb-3 sm:mb-6"></div>
          <p class="text-gray-500 max-w-lg mx-auto text-xs sm:text-base md:text-lg px-2">
            Temukan referensi buku terbaik berdasarkan spesialisasi fakultas kamu.
          </p>
        </div>

        <!-- LOADING STATE -->
        <div
          v-if="loading"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6"
        >
          <div
            v-for="n in 8"
            :key="n"
            class="bg-gray-50 border border-gray-100 rounded-2xl h-32 sm:h-44 md:h-48 animate-pulse flex flex-col items-center justify-center gap-3"
          >
            <div class="w-10 h-10 sm:w-14 sm:h-14 bg-gray-200 rounded-2xl"></div>
            <div class="w-16 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        <!-- ERROR STATE -->
        <div
          v-else-if="error"
          class="flex flex-col items-center justify-center py-14 sm:py-24 text-gray-400 bg-red-50/50 rounded-2xl border-2 border-dashed border-red-100"
        >
          <ExclamationTriangleIcon class="w-12 h-12 sm:w-20 sm:h-20 mb-3 text-red-300" />
          <p class="text-base sm:text-xl font-bold text-gray-700">Gagal memuat kategori</p>
          <p class="text-xs sm:text-sm mt-2 mb-5 text-gray-400">Periksa koneksi internet kamu.</p>
          <button
            @click="fetchCategories()"
            class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 active:scale-95 transition-all duration-200"
          >
            <ArrowPathIcon class="w-4 h-4" />
            Coba Lagi
          </button>
        </div>

        <!-- EMPTY STATE -->
        <div
          v-else-if="categories.length === 0"
          class="flex flex-col items-center justify-center py-14 sm:py-24 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100"
        >
          <InboxIcon class="w-12 h-12 sm:w-20 sm:h-20 mb-3 text-gray-200" />
          <p class="text-base sm:text-xl font-bold text-gray-700">Kategori Kosong</p>
          <p class="text-xs sm:text-sm mt-2">Daftar fakultas akan segera hadir.</p>
        </div>

        <!-- CATEGORY GRID -->
        <div
          v-else
          :class="[
            'grid gap-3 sm:gap-4 lg:gap-6',
            categories.length === 1
              ? 'grid-cols-1 max-w-[200px] mx-auto'
              : categories.length === 2
                ? 'grid-cols-2 max-w-sm mx-auto sm:max-w-none'
                : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
          ]"
        >
          <div
            v-for="(category, index) in categories"
            :key="category.id"
            @click="$router.push({ path: '/books', query: { category: category.id } })"
            class="category-card group relative bg-white rounded-2xl text-center border border-gray-100 shadow-sm hover:shadow-lg active:scale-95 transition-all duration-300 cursor-pointer hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden animate-fade-in"
            :style="{ animationDelay: index * 80 + 'ms' }"
          >
            <div
              class="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            ></div>

            <!-- ICON -->
            <div
              class="icon-box relative z-10 mx-auto flex items-center justify-center rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110"
            >
              <component :is="resolveIcon(category.icon)" class="icon-size text-blue-600" />
            </div>

            <!-- TITLE -->
            <h3
              :title="category.name"
              class="category-title relative z-10 font-semibold text-gray-800 group-hover:text-blue-600 transition duration-300 leading-tight line-clamp-2 hyphens-auto"
            >
              {{ category.name }}
            </h3>

            <p
              class="hidden sm:block relative z-10 mt-2 text-[10px] font-bold text-blue-500 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              Eksplor →
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.category-card {
  padding: clamp(8px, 2vw, 32px) !important;
}

.icon-box {
  width: clamp(32px, 7vw, 64px) !important;
  height: clamp(32px, 7vw, 64px) !important;
  margin-bottom: clamp(6px, 1.5vw, 16px) !important;
}

.icon-size {
  width: clamp(16px, 3.5vw, 32px) !important;
  height: clamp(16px, 3.5vw, 32px) !important;
}

.category-title {
  font-size: clamp(9px, 2vw, 14px) !important;
  word-break: break-word;
  margin-top: clamp(4px, 1vw, 8px);
}

.grid-wave {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, rgba(59, 130, 246, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

.grid-wave::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(59, 130, 246, 0.1) 50%,
    transparent 100%
  );
  animation: shimmer 10s linear infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-20px) scale(1.05);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 1s ease-out forwards;
}
.animate-fade-in {
  opacity: 0;
  animation: fadeIn 0.8s ease-out forwards;
}
.animate-float {
  animation: float 8s ease-in-out infinite;
}
.animate-float-delayed {
  animation: float 10s ease-in-out infinite;
  animation-delay: 2s;
}

.backdrop-blur-sm {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
