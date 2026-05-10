<script setup>
import NavBar from '@/components/NavbarComponent.vue'
import Footer from '@/components/FooterComponent.vue'
import { useAuth } from '@/stores/auth' // ✅ satu import saja
import { onMounted } from 'vue'

const { initAuth } = useAuth()

onMounted(() => {
  initAuth()
})
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
