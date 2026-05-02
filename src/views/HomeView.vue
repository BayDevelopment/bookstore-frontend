<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-blue-600 text-white py-20 px-6 text-center">
      <h1 class="text-4xl font-bold mb-4">Toko Buku Universitas Alkhairiyah</h1>
      <p class="text-lg mb-8">Temukan buku digital & cetak untuk semua fakultas</p>
      <router-link
        to="/books"
        class="bg-white text-blue-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100"
      >
        Lihat Buku
      </router-link>
    </section>

    <!-- Kategori Fakultas -->
    <section class="py-12 px-6">
      <h2 class="text-2xl font-bold text-center mb-8">Kategori Fakultas</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div
          v-for="fakultas in fakultasList"
          :key="fakultas.name"
          class="bg-white rounded-xl shadow p-6 text-center cursor-pointer hover:shadow-md transition"
        >
          <div class="text-4xl mb-2">{{ fakultas.icon }}</div>
          <p class="font-semibold text-gray-700">{{ fakultas.name }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const fakultasList = [
  { name: 'Teknik', icon: '⚙️' },
  { name: 'Hukum', icon: '⚖️' },
  { name: 'Ekonomi', icon: '📊' },
  { name: 'FKIP', icon: '📖' },
]
</script>
