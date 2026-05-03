<script setup>
import { ref, onMounted } from 'vue'

const user = ref(null)

onMounted(() => {
  const data = localStorage.getItem('user')
  if (data) user.value = JSON.parse(data)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 relative overflow-hidden">
    <!-- ================= BACKGROUND ================= -->
    <div class="absolute inset-0 pointer-events-none">
      <!-- grid -->
      <div
        class="w-full h-full bg-[linear-gradient(to_right,rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:40px_40px]"
      ></div>

      <!-- glow -->
      <div class="absolute inset-0 flex justify-center items-center">
        <div class="w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>
    </div>

    <!-- ================= CONTENT ================= -->
    <div class="relative max-w-7xl mx-auto px-6 py-10">
      <!-- ===== HEADER ===== -->
      <div class="mb-10">
        <h1 class="text-2xl font-semibold text-gray-800">
          Halo, {{ user?.name || 'Mahasiswa' }} 👋
        </h1>
        <p class="text-gray-500 text-sm mt-1">Selamat datang kembali di BookStore Unival</p>
      </div>

      <!-- ===== STATS ===== -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <div class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">Buku Tersedia</p>
          <h2 class="text-xl font-semibold text-gray-800 mt-1">120+</h2>
        </div>

        <div class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">Keranjang</p>
          <h2 class="text-xl font-semibold text-gray-800 mt-1">3</h2>
        </div>

        <div class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">Pesanan</p>
          <h2 class="text-xl font-semibold text-gray-800 mt-1">1</h2>
        </div>

        <div class="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">Status</p>
          <h2 class="text-green-600 font-semibold mt-1">Aktif</h2>
        </div>
      </div>

      <!-- ===== QUICK ACTION ===== -->
      <div class="grid md:grid-cols-3 gap-6 mb-10">
        <router-link
          to="/books"
          class="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition"
        >
          <div class="text-3xl mb-3">📚</div>
          <h3 class="font-semibold text-gray-800 group-hover:text-blue-600">Jelajahi Buku</h3>
          <p class="text-sm text-gray-500 mt-1">Cari buku untuk kebutuhan kuliahmu</p>
        </router-link>

        <router-link
          to="/keranjang"
          class="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition"
        >
          <div class="text-3xl mb-3">🛒</div>
          <h3 class="font-semibold text-gray-800 group-hover:text-blue-600">Keranjang</h3>
          <p class="text-sm text-gray-500 mt-1">Lihat buku yang sudah kamu pilih</p>
        </router-link>

        <router-link
          to="/profile"
          class="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition"
        >
          <div class="text-3xl mb-3">👤</div>
          <h3 class="font-semibold text-gray-800 group-hover:text-blue-600">Profil Saya</h3>
          <p class="text-sm text-gray-500 mt-1">Kelola akun dan data diri</p>
        </router-link>
      </div>

      <!-- ===== AKTIVITAS ===== -->
      <div class="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 class="font-semibold text-gray-800 mb-4">Aktivitas Terakhir</h3>

        <div class="text-sm text-gray-500">Belum ada aktivitas terbaru</div>
      </div>
    </div>
  </div>
</template>
