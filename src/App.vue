<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/stores/auth'
import NavBar from '@/components/NavbarComponent.vue'
import Footer from '@/components/FooterComponent.vue'

const { initAuth } = useAuth()
const router = useRouter()
const route = useRoute()

const authExpiredHandler = () => {
  router.replace({
    name: 'login',
    query: { reason: 'timeout', redirect: route.fullPath },
  })
}

onMounted(async () => {
  await router.isReady()
  const result = initAuth()

  if (!result.valid && route.meta.requiresAuth) {
    authExpiredHandler()
  }

  window.addEventListener('auth:expired', authExpiredHandler)
})

onUnmounted(() => {
  window.removeEventListener('auth:expired', authExpiredHandler)
})
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <!-- ← Ganti jadi min-h-screen -->
    <NavBar />

    <main class="flex-1 bg-gray-50 overflow-x-hidden">
      <!-- ← flex-1 + overflow -->
      <RouterView />
    </main>

    <Footer />
  </div>
</template>
