<template>
  <nav class="bg-white shadow-md px-6 py-4 flex justify-between items-center">
    <!-- Logo -->
    <router-link to="/" class="text-xl font-bold text-blue-600">
      📚 Bookstore Alkhairiyah
    </router-link>

    <!-- Menu -->
    <div class="flex gap-4 items-center">
      <router-link to="/" class="text-gray-600 hover:text-blue-600">Home</router-link>
      <router-link to="/books" class="text-gray-600 hover:text-blue-600">Buku</router-link>

      <!-- Kalau belum login -->
      <router-link to="/login" class="text-gray-600 hover:text-blue-600">Login</router-link>
      <router-link
        to="/register"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Daftar
      </router-link>
    </div>
  </nav>
</template>
