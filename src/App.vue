<script setup>
import NavBar from '@/components/navbar.vue'
</script>

<template>
  <div>
    <NavBar />
    <main class="min-h-screen bg-gray-50">
      <RouterView />
    </main>
  </div>
</template>

<style scoped></style>
