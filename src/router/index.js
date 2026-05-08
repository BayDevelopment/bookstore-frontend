import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      beforeEnter: () => {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || 'null')
        if (token && user) return { name: 'dashboard' }
      },
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/books',
      name: 'books',
      component: () => import('@/views/BookView.vue'),
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: () => import('@/views/BookDetailView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginVue.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterVue.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/views/auth/VerifyEmailView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/keranjang',
      name: 'keranjang',
      component: () => import('@/views/KeranjangView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/orders',
      component: () => import('@/views/MyOrdersView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/orders/:id',
      component: () => import('@/views/OrderDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/checkout',
      component: () => import('@/views/CheckoutView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isLoggedIn = !!token && !!user

  if (to.meta.requiresAuth && !isLoggedIn) return { name: 'login' }
  if (to.meta.requiresAuth && isLoggedIn && !user.email_verified_at) return { name: 'verify-email' }
  if (to.meta.guestOnly && isLoggedIn) return { name: 'dashboard' }
})

export default router
