<script setup>
import { ref, onMounted } from 'vue'
// Import hanya yang dibutuhkan untuk menghemat size bundle
import {
  BookOpenIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  BeakerIcon, // Contoh: Untuk Fakultas Teknik/Sains
  BriefcaseIcon, // Contoh: Untuk Ekonomi
  ScaleIcon, // Contoh: Untuk Hukum
  InboxIcon,
} from '@heroicons/vue/24/outline'
import api from '@/lib/axios'

// Mapping icon agar tidak perlu import * (Tree-shaking friendly)
const iconList = {
  BookOpenIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  BeakerIcon,
  BriefcaseIcon,
  ScaleIcon,
  InboxIcon,
}

const categories = ref([])
const loading = ref(true)

const resolveIcon = (iconName) => {
  // Jika iconName dari API adalah "BeakerIcon", dia akan ambil dari object iconList
  return iconList[iconName] || BookOpenIcon
}

onMounted(async () => {
  try {
    const response = await api.get('/categories')
    // Pastikan response.data sesuai dengan struktur (biasanya response.data.data)
    categories.value = response.data.data || response.data
  } catch (e) {
    console.error('Gagal load kategori:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <!-- HERO SECTION -->
    <section class="relative overflow-hidden bg-white border-b border-gray-100">
      <div class="absolute inset-0 pointer-events-none grid-wave"></div>

      <div class="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <!-- LEFT CONTENT -->
        <div class="z-10 text-center md:text-left">
          <h1 class="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-4">
            <span class="text-blue-600">BookStore</span> Unival
          </h1>

          <p class="text-lg text-gray-500 mb-8 max-w-lg mx-auto md:mx-0">
            Temukan buku digital & cetak terbaik untuk menunjang pembelajaranmu di setiap fakultas.
          </p>

          <div class="flex gap-4 flex-wrap justify-center md:justify-start">
            <router-link
              to="/books"
              class="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-full shadow-md hover:shadow-blue-200 hover:bg-blue-700 transition-all duration-300"
            >
              <BookOpenIcon class="w-5 h-5" />
              <span class="font-medium">Jelajahi Buku</span>
            </router-link>

            <router-link
              to="/register"
              class="inline-flex items-center gap-2 border border-gray-200 bg-white px-8 py-3.5 rounded-full text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:shadow-sm transition-all duration-300"
            >
              <RocketLaunchIcon class="w-5 h-5" />
              <span class="font-medium">Mulai Sekarang</span>
            </router-link>
          </div>
        </div>

        <!-- RIGHT IMAGE/ICON -->
        <div class="flex justify-center relative">
          <div
            class="absolute w-[250px] h-[250px] bg-blue-400/20 rounded-full blur-3xl animate-pulse"
          ></div>
          <AcademicCapIcon
            class="relative z-10 w-32 h-32 md:w-44 md:h-44 text-blue-600 animate-float"
          />
        </div>
      </div>
    </section>

    <!-- KATEGORI SECTION -->
    <section class="py-24 px-6 relative overflow-hidden bg-white">
      <!-- EFEK SPLASH NGAMBANG -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <!-- Splash 1: Kiri Atas -->
        <div
          class="absolute -top-20 -left-20 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] animate-float"
        ></div>

        <!-- Splash 2: Kanan Tengah -->
        <div
          class="absolute top-1/4 -right-20 w-[30rem] h-[30rem] bg-indigo-50/50 rounded-full blur-[120px] animate-float-delayed"
        ></div>

        <!-- Splash 3: Tengah Bawah -->
        <div
          class="absolute -bottom-32 left-1/3 w-[40rem] h-[40rem] bg-blue-50/60 rounded-full blur-[130px] animate-float"
        ></div>

        <!-- Grid Halus (Opsional, dihapus jika ingin benar-benar polos) -->
        <div
          class="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"
        ></div>
      </div>

      <div class="relative max-w-6xl mx-auto">
        <!-- Judul dengan Fade In -->
        <div class="text-center mb-20 animate-fade-in-up">
          <h2 class="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Kategori Fakultas
          </h2>
          <div class="w-24 h-2 bg-blue-600 mx-auto rounded-full mb-6"></div>
          <p class="text-gray-500 max-w-lg mx-auto text-lg">
            Temukan referensi buku terbaik berdasarkan spesialisasi fakultas kamu.
          </p>
        </div>

        <!-- LOADING STATE -->
        <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div
            v-for="n in 8"
            :key="n"
            class="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 h-48 animate-pulse flex flex-col items-center justify-center gap-4"
          >
            <div class="w-16 h-16 bg-gray-200 rounded-2xl"></div>
            <div class="w-28 h-5 bg-gray-200 rounded-full"></div>
          </div>
        </div>

        <!-- EMPTY STATE -->
        <div
          v-else-if="categories.length === 0"
          class="flex flex-col items-center justify-center py-24 text-gray-400 bg-gray-50/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-gray-100"
        >
          <InboxIcon class="w-20 h-20 mb-4 text-gray-200" />
          <p class="text-xl font-bold text-gray-700">Kategori Kosong</p>
          <p class="text-sm mt-2">Daftar fakultas akan segera hadir.</p>
        </div>

        <!-- CATEGORY GRID -->
        <div v-else class="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div
            v-for="(category, index) in categories"
            :key="category.id"
            @click="$router.push({ path: '/books', query: { category: category.id } })"
            class="group relative bg-white rounded-[2.5rem] p-10 text-center border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.12)] transition-all duration-700 cursor-pointer hover:-translate-y-4 overflow-hidden animate-fade-in"
            :style="{ animationDelay: index * 100 + 'ms' }"
          >
            <!-- Subtle Interior Background -->
            <div
              class="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            ></div>

            <div
              class="relative z-10 w-20 h-20 mx-auto flex items-center justify-center rounded-3xl bg-blue-50 mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-700"
            >
              <component
                :is="resolveIcon(category.icon)"
                class="w-10 h-10 text-blue-600 transition-transform duration-700 group-hover:scale-110"
              />
            </div>

            <h3
              class="relative z-10 font-bold text-gray-800 group-hover:text-blue-600 transition duration-300 text-xl"
            >
              {{ category.name }}
            </h3>

            <div
              class="mt-6 flex items-center justify-center gap-2 text-xs font-black text-blue-600 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 uppercase tracking-[0.2em]"
            >
              Eksplor <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.bg-grid-pattern {
  background-image: radial-gradient(circle, #3b82f6 1px, transparent 1px);
  background-size: 30px 30px;
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

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}
/* Animasi Fade In Up untuk Judul */
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

/* Animasi Fade In Simple untuk Card */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Animasi Mengambang (Floating) */
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

/* Backdrop blur untuk elemen pendukung */
.backdrop-blur-sm {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
</style>
