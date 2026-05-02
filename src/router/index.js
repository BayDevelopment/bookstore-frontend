import { createRouter, createWebHistory } from 'vue-router'
import Homeview from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: Homeview },
    { path: '/books', name: 'books', component: () => import('../views/BookView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/auth/LoginVue.vue') },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterVue.vue'),
    },
  ],
})

export default router
