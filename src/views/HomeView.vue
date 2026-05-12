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
      <div class="absolute inset-0 pointer-events-none grid-bg"></div>
      <div
        class="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 grid md:grid-cols-2 gap-8 md:gap-10 items-center"
      >
        <div class="z-10 text-center md:text-left">
          <h1
            class="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 leading-tight mb-3 sm:mb-4"
          >
            <span class="text-blue-600">BookStore</span> Unival
          </h1>
          <p class="text-base sm:text-lg text-gray-500 mb-5 sm:mb-6 max-w-lg mx-auto md:mx-0">
            Temukan buku digital &amp; cetak terbaik untuk menunjang pembelajaranmu di setiap
            fakultas.
          </p>

          <!-- ✅ SDG SECTION BARU -->
          <div class="sdg-wrapper">
            <p class="sdg-label">Mendukung Tujuan Pembangunan Berkelanjutan</p>
            <div class="sdg-cards">
              <!-- SDG 4 -->
              <div class="sdg-card sdg-4">
                <div class="sdg-icon-wrap">
                  <span class="sdg-number">4</span>
                  <svg
                    class="sdg-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div class="sdg-text">
                  <span class="sdg-title">Pendidikan Berkualitas</span>
                  <span class="sdg-desc">Akses buku merata untuk semua mahasiswa</span>
                </div>
                <div class="sdg-glow"></div>
              </div>

              <!-- SDG 10 -->
              <div class="sdg-card sdg-10">
                <div class="sdg-icon-wrap">
                  <span class="sdg-number">10</span>
                  <svg
                    class="sdg-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8M12 8v8" />
                  </svg>
                </div>
                <div class="sdg-text">
                  <span class="sdg-title">Kurangi Kesenjangan</span>
                  <span class="sdg-desc">Harga terjangkau, akses setara</span>
                </div>
                <div class="sdg-glow"></div>
              </div>

              <!-- SDG 12 -->
              <div class="sdg-card sdg-12">
                <div class="sdg-icon-wrap">
                  <span class="sdg-number">12</span>
                  <svg
                    class="sdg-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
                    />
                  </svg>
                </div>
                <div class="sdg-text">
                  <span class="sdg-title">Konsumsi Bertanggung Jawab</span>
                  <span class="sdg-desc">PDF digital, kurangi limbah kertas</span>
                </div>
                <div class="sdg-glow"></div>
              </div>
            </div>
          </div>
          <!-- ✅ END SDG SECTION -->

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

        <div class="flex justify-center relative py-8 md:py-12">
          <div class="logo-orbit-wrapper">
            <div class="logo-orbit-glow"></div>

            <div class="logo-orbit-ring logo-orbit-ring-inner"></div>
            <div class="logo-orbit-ring logo-orbit-ring-outer"></div>

            <!-- SVG SDG mengelilingi logo -->
            <div class="logo-orbit-track">
              <!-- SDG 4 -->
              <div
                class="logo-orbit-item orbit-sdg-4"
                style="--angle: -90deg; --angle-reverse: 90deg"
              >
                <div class="logo-orbit-counter">
                  <div class="logo-orbit-badge">
                    <span class="logo-orbit-number">4</span>
                    <svg
                      class="logo-orbit-svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                    >
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- SDG 10 -->
              <div
                class="logo-orbit-item orbit-sdg-10"
                style="--angle: 30deg; --angle-reverse: -30deg"
              >
                <div class="logo-orbit-counter">
                  <div class="logo-orbit-badge">
                    <span class="logo-orbit-number">10</span>
                    <svg
                      class="logo-orbit-svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 12h8M12 8v8" />
                    </svg>
                  </div>
                </div>
              </div>

              <!-- SDG 12 -->
              <div
                class="logo-orbit-item orbit-sdg-12"
                style="--angle: 150deg; --angle-reverse: -150deg"
              >
                <div class="logo-orbit-counter">
                  <div class="logo-orbit-badge">
                    <span class="logo-orbit-number">12</span>
                    <svg
                      class="logo-orbit-svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                    >
                      <path
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Logo utama -->
            <div class="logo-main-core">
              <AcademicCapIcon class="logo-main-icon w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44" />
            </div>
          </div>
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

            <div
              class="icon-box relative z-10 mx-auto flex items-center justify-center rounded-2xl bg-blue-50 group-hover:bg-blue-100 transition-all duration-300 group-hover:scale-110"
            >
              <component :is="resolveIcon(category.icon)" class="icon-size text-blue-600" />
            </div>

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
/* =========================
   LOGO ORBIT ONLY
========================= */

.logo-orbit-wrapper {
  --orbit-size: 280px;
  --orbit-radius: 118px;

  position: relative;
  width: var(--orbit-size);
  height: var(--orbit-size);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
}

.logo-orbit-glow {
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.35),
    rgba(14, 165, 233, 0.14),
    transparent 70%
  );
  filter: blur(32px);
  animation: logoGlowPulse 3.5s ease-in-out infinite;
}

.logo-orbit-ring {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.logo-orbit-ring-inner {
  width: 205px;
  height: 205px;
  border: 1px dashed rgba(59, 130, 246, 0.35);
  box-shadow: inset 0 0 28px rgba(59, 130, 246, 0.1);
  animation: logoRingRotate 22s linear infinite;
}

.logo-orbit-ring-outer {
  width: 270px;
  height: 270px;
  border: 1px solid rgba(168, 85, 247, 0.22);
  box-shadow:
    0 0 35px rgba(59, 130, 246, 0.15),
    inset 0 0 30px rgba(168, 85, 247, 0.08);
  animation: logoRingRotateReverse 28s linear infinite;
}

.logo-orbit-track {
  position: absolute;
  inset: 0;
  z-index: 6;
  border-radius: 999px;
  animation: logoOrbitRotate 16s linear infinite;
}

.logo-orbit-item {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 66px;
  height: 66px;
  margin-top: -33px;
  margin-left: -33px;
  transform: rotate(var(--angle)) translateX(var(--orbit-radius)) rotate(var(--angle-reverse));
  transform-origin: center;
}

.logo-orbit-counter {
  width: 100%;
  height: 100%;
  animation: logoOrbitCounter 16s linear infinite;
}

.logo-orbit-badge {
  position: relative;
  width: 66px;
  height: 66px;
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.72)),
    radial-gradient(circle at top, rgba(255, 255, 255, 0.16), transparent 58%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 18px 45px rgba(0, 0, 0, 0.28),
    0 0 26px currentColor,
    inset 0 0 22px rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  animation: logoBadgeFloat 3.2s ease-in-out infinite;
}

.logo-orbit-number {
  position: absolute;
  top: -9px;
  right: -8px;
  min-width: 27px;
  height: 27px;
  padding: 0 7px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  color: #0f172a;
  font-size: 11px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
}

.logo-orbit-svg {
  width: 34px;
  height: 34px;
  color: currentColor;
  filter: drop-shadow(0 8px 16px currentColor);
  animation: logoSvgSpin 7s linear infinite;
}

/* Warna disamakan seperti SVG SDG sebelumnya */
.orbit-sdg-4 {
  color: #38bdf8;
}

.orbit-sdg-10 {
  color: #a78bfa;
}

.orbit-sdg-12 {
  color: #34d399;
}

.logo-main-core {
  position: relative;
  z-index: 5;
  width: 150px;
  height: 150px;
  border-radius: 999px;
  display: flex;
  justify-content: center;
  align-items: center;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.22), rgba(59, 130, 246, 0.08)),
    radial-gradient(circle at top, rgba(56, 189, 248, 0.22), transparent 60%);
  border: 1px solid rgba(125, 211, 252, 0.35);
  box-shadow:
    0 25px 70px rgba(37, 99, 235, 0.24),
    inset 0 0 35px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  animation: logoMainFloat 4s ease-in-out infinite;
}

.logo-main-icon {
  color: #2563eb;
  filter: drop-shadow(0 15px 25px rgba(37, 99, 235, 0.45));
}

/* =========================
   ANIMATION
========================= */

@keyframes logoOrbitRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes logoOrbitCounter {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

@keyframes logoSvgSpin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes logoRingRotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes logoRingRotateReverse {
  from {
    transform: rotate(360deg);
  }

  to {
    transform: rotate(0deg);
  }
}

@keyframes logoMainFloat {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-14px);
  }
}

@keyframes logoBadgeFloat {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }

  50% {
    transform: translateY(-6px) scale(1.04);
  }
}

@keyframes logoGlowPulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.12);
  }
}

/* =========================
   RESPONSIVE LOGO ONLY
========================= */

@media (min-width: 640px) {
  .logo-orbit-wrapper {
    --orbit-size: 330px;
    --orbit-radius: 140px;
  }

  .logo-orbit-ring-inner {
    width: 245px;
    height: 245px;
  }

  .logo-orbit-ring-outer {
    width: 320px;
    height: 320px;
  }

  .logo-main-core {
    width: 180px;
    height: 180px;
  }

  .logo-orbit-item,
  .logo-orbit-badge {
    width: 70px;
    height: 70px;
  }

  .logo-orbit-item {
    margin-top: -35px;
    margin-left: -35px;
  }

  .logo-orbit-svg {
    width: 36px;
    height: 36px;
  }
}

@media (min-width: 1024px) {
  .logo-orbit-wrapper {
    --orbit-size: 400px;
    --orbit-radius: 170px;
  }

  .logo-orbit-ring-inner {
    width: 300px;
    height: 300px;
  }

  .logo-orbit-ring-outer {
    width: 390px;
    height: 390px;
  }

  .logo-main-core {
    width: 220px;
    height: 220px;
  }

  .logo-orbit-item,
  .logo-orbit-badge {
    width: 76px;
    height: 76px;
  }

  .logo-orbit-item {
    margin-top: -38px;
    margin-left: -38px;
  }

  .logo-orbit-badge {
    border-radius: 24px;
  }

  .logo-orbit-svg {
    width: 40px;
    height: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .logo-orbit-glow,
  .logo-orbit-ring,
  .logo-orbit-track,
  .logo-orbit-counter,
  .logo-orbit-badge,
  .logo-orbit-svg,
  .logo-main-core {
    animation: none;
  }
}
/* ════════════════════════════════════════
   SDG SECTION
════════════════════════════════════════ */
/* ════════════════════════════════════════
   SDG SECTION
════════════════════════════════════════ */
.sdg-wrapper {
  position: relative;
  margin: 1.25rem 0 1.75rem;
  padding: 1rem;
  border-radius: 22px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(186, 230, 253, 0.34), transparent 36%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.16), transparent 42%),
    linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(219, 234, 254, 0.82));
  border: 1px solid rgba(147, 197, 253, 0.35);
  box-shadow:
    0 18px 45px rgba(37, 99, 235, 0.1),
    inset 0 0 30px rgba(255, 255, 255, 0.45);
}

.sdg-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.055) 1px, transparent 1px);
  background-size: 28px 28px;
  opacity: 0.8;
  pointer-events: none;
}

.sdg-label {
  position: relative;
  z-index: 2;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 0.75rem;
  text-align: center;
}

@media (min-width: 768px) {
  .sdg-label {
    text-align: left;
  }
}

.sdg-cards {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 480px) {
  .sdg-cards {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.55rem;
  }
}

.sdg-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem 0.65rem 0.65rem;
  border-radius: 16px;
  border: 1px solid rgba(186, 230, 253, 0.45);
  overflow: hidden;
  cursor: default;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
  flex: 1 1 auto;
  min-width: 0;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(239, 246, 255, 0.48)),
    radial-gradient(circle at top left, rgba(186, 230, 253, 0.24), transparent 55%);
  box-shadow:
    0 10px 28px rgba(37, 99, 235, 0.08),
    inset 0 0 22px rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
}

.sdg-card:hover {
  transform: translateY(-3px);
  border-color: rgba(125, 211, 252, 0.8);
  box-shadow:
    0 16px 38px rgba(14, 165, 233, 0.16),
    inset 0 0 26px rgba(255, 255, 255, 0.7);
}

.sdg-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(circle at 0% 50%, rgba(186, 230, 253, 0.16), transparent 70%);
}

/* Semua card dibuat satu nuansa: biru muda pudar */
.sdg-4,
.sdg-10,
.sdg-12 {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(219, 234, 254, 0.52)),
    radial-gradient(circle at top left, rgba(186, 230, 253, 0.28), transparent 56%);
  border-color: rgba(147, 197, 253, 0.42);
}

.sdg-4 .sdg-icon-wrap,
.sdg-10 .sdg-icon-wrap,
.sdg-12 .sdg-icon-wrap {
  background:
    linear-gradient(145deg, rgba(219, 234, 254, 0.78), rgba(125, 211, 252, 0.24)),
    rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(186, 230, 253, 0.55);
  box-shadow:
    0 8px 22px rgba(14, 165, 233, 0.12),
    inset 0 0 18px rgba(255, 255, 255, 0.75);
}

/* Nomor SDG */
.sdg-4 .sdg-number,
.sdg-10 .sdg-number,
.sdg-12 .sdg-number {
  color: #1e40af;
}

/* SVG icon warna biru muda pudar / putih */
.sdg-4 .sdg-icon,
.sdg-10 .sdg-icon,
.sdg-12 .sdg-icon {
  color: rgba(255, 255, 255, 0.92);
  filter: drop-shadow(0 0 7px rgba(125, 211, 252, 0.7))
    drop-shadow(0 6px 12px rgba(59, 130, 246, 0.2));
}

/* Text dibuat tetap readable */
.sdg-4 .sdg-title,
.sdg-10 .sdg-title,
.sdg-12 .sdg-title {
  color: #1e3a8a;
}

.sdg-4 .sdg-desc,
.sdg-10 .sdg-desc,
.sdg-12 .sdg-desc {
  color: #64748b;
}

.sdg-icon-wrap {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (min-width: 640px) {
  .sdg-icon-wrap {
    width: 44px;
    height: 44px;
  }
}

.sdg-number {
  position: absolute;
  top: 3px;
  left: 5px;
  font-size: 0.52rem;
  font-weight: 900;
  line-height: 1;
}

.sdg-icon {
  width: 17px;
  height: 17px;
  margin-top: 4px;
}

.sdg-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.sdg-title {
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1.2;
}

.sdg-desc {
  font-size: 0.58rem;
  font-weight: 500;
  line-height: 1.3;
  opacity: 0.88;
}

@media (min-width: 640px) {
  .sdg-title {
    font-size: 0.73rem;
  }

  .sdg-desc {
    font-size: 0.61rem;
  }
}

@media (min-width: 768px) {
  .sdg-title {
    font-size: 0.76rem;
  }

  .sdg-desc {
    font-size: 0.63rem;
  }
}
/* ════════════════════════════════════════
   EXISTING STYLES (tidak diubah)
════════════════════════════════════════ */
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
