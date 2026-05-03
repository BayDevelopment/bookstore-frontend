<script setup>
import {
  Cog6ToothIcon,
  ScaleIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BookOpenIcon,
  RocketLaunchIcon,
} from '@heroicons/vue/24/outline'

const fakultasList = [
  { name: 'Teknik', icon: Cog6ToothIcon },
  { name: 'Hukum', icon: ScaleIcon },
  { name: 'Ekonomi', icon: ChartBarIcon },
  { name: 'FKIP', icon: AcademicCapIcon },
]
</script>

<template>
  <div class="bg-gray-50">
    <!-- ================= HERO ================= -->
    <section class="relative overflow-hidden bg-white">
      <div class="absolute inset-0 pointer-events-none grid-wave"></div>

      <div class="relative max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <!-- LEFT -->
        <div>
          <h1 class="text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-4">
            <span class="text-blue-600">BookStore</span> Unival
          </h1>

          <p class="text-lg text-gray-500 mb-6">
            Temukan buku digital & cetak terbaik untuk menunjang pembelajaranmu di setiap fakultas.
          </p>

          <div class="flex gap-4 flex-wrap">
            <!-- Jelajahi Buku -->
            <router-link
              to="/books"
              class="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow hover:shadow-lg hover:bg-blue-700 transition-all duration-200"
            >
              <BookOpenIcon class="w-5 h-5" />
              <span>Jelajahi Buku</span>
            </router-link>

            <!-- Mulai Sekarang -->
            <router-link
              to="/register"
              class="inline-flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-full text-gray-700 hover:border-blue-600 hover:text-blue-600 hover:shadow-sm transition-all duration-200"
            >
              <RocketLaunchIcon class="w-5 h-5" />
              <span>Mulai Sekarang</span>
            </router-link>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="flex justify-center relative">
          <!-- Glow -->
          <div class="absolute w-[300px] h-[300px] bg-blue-400/20 rounded-full blur-3xl"></div>

          <!-- ICON -->
          <AcademicCapIcon
            class="relative z-10 w-28 h-28 md:w-36 md:h-36 text-blue-600 animate-float"
          />
        </div>
      </div>
    </section>

    <!-- ================= KATEGORI ================= -->
    <section class="py-20 px-6 relative">
      <div class="absolute inset-0 opacity-30 pointer-events-none">
        <div
          class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:40px_40px]"
        ></div>
      </div>

      <div class="relative max-w-6xl mx-auto">
        <!-- HEADER -->
        <div class="text-center mb-14">
          <h2 class="text-3xl md:text-4xl font-semibold text-gray-800 mb-3">Kategori Fakultas</h2>
          <p class="text-gray-500">Pilih kategori sesuai bidangmu untuk menemukan buku terbaik</p>
        </div>

        <!-- GRID -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div
            v-for="fakultas in fakultasList"
            :key="fakultas.name"
            class="group relative bg-white rounded-2xl p-6 text-center border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2 overflow-hidden"
          >
            <!-- glow -->
            <div
              class="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-300/10"
            ></div>

            <!-- ICON -->
            <div
              class="relative w-14 h-14 mx-auto flex items-center justify-center rounded-xl bg-blue-50 mb-4 group-hover:bg-blue-600 transition-all duration-300"
            >
              <component
                :is="fakultas.icon"
                class="w-6 h-6 text-blue-600 group-hover:text-white transition-all duration-300 group-hover:scale-110"
              />
            </div>

            <!-- TITLE -->
            <p class="relative font-semibold text-gray-700 group-hover:text-blue-600 transition">
              {{ fakultas.name }}
            </p>

            <!-- CTA -->
            <div class="mt-3 text-xs text-gray-400 group-hover:text-blue-500 transition">
              Lihat →
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CTA ================= -->
    <section class="px-6 pb-20">
      <div
        class="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-10 text-center hover:shadow-lg transition"
      >
        <h3 class="text-xl font-semibold text-gray-800 mb-3">
          Tidak menemukan buku yang kamu cari?
        </h3>

        <p class="text-gray-500 mb-6">
          Gunakan fitur pencarian atau jelajahi semua koleksi buku kami.
        </p>

        <router-link
          to="/books"
          class="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 hover:shadow-lg transition"
        >
          Lihat Semua Buku
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* GRID SHIMMER */
.grid-wave {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, rgba(59, 130, 246, 0.12) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.12) 1px, transparent 1px);
  background-size: 40px 40px;
}

.grid-wave::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    120deg,
    transparent 0%,
    rgba(59, 130, 246, 0.2) 30%,
    rgba(59, 130, 246, 0.4) 50%,
    rgba(59, 130, 246, 0.2) 70%,
    transparent 100%
  );
  mix-blend-mode: lighten;
  animation: shimmer 7s linear infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* FLOAT */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
.animate-float {
  animation: float 4s ease-in-out infinite;
}
</style>
