<script setup>
import NavBar from '@/components/navbar.vue'
import Footer from '@/components/footer.vue'
</script>

<template>
  <div>
    <NavBar />
    <main class="min-h-screen bg-gray-50">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<style scoped></style>
