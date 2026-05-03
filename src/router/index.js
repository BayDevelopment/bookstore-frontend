import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // =====================
    // PUBLIC ROUTES
    // =====================
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/books',
      name: 'books',
      component: () => import('@/views/BookView.vue'),
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
    // {
    //   path: '/forgot-password',
    //   name: 'forgot-password',
    //   component: () => import('@/views/auth/ForgotPasswordView.vue'),
    //   meta: { guestOnly: true },
    // },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/views/auth/VerifyEmailView.vue'),
    },

    // =====================
    // PROTECTED ROUTES
    // =====================
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/profile',
    //   name: 'profile',
    //   component: () => import('@/views/ProfileView.vue'),
    //   meta: { requiresAuth: true },
    // },
    {
      path: '/keranjang',
      name: 'keranjang',
      component: () => import('@/views/KeranjangView.vue'),
      meta: { requiresAuth: true },
    },
    // {
    //   path: '/orders',
    //   name: 'orders',
    //   component: () => import('@/views/OrderView.vue'),
    //   meta: { requiresAuth: true },
    // },
    // {
    //   path: '/likes',
    //   name: 'likes',
    //   component: () => import('@/views/LikeView.vue'),
    //   meta: { requiresAuth: true },
    // },

    // =====================
    // 404
    // =====================
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'not-found',
    //   component: () => import('@/views/NotFoundView.vue'),
    // },
  ],
})

// =====================
// ROUTE GUARD
// =====================
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isLoggedIn = !!token && !!user

  // Belum login → coba akses halaman protected
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'login' })
  }

  // Sudah login tapi email belum diverifikasi
  if (to.meta.requiresAuth && isLoggedIn && !user.email_verified_at) {
    return next({ name: 'verify-email' })
  }

  // Sudah login → coba akses login/register
  if (to.meta.guestOnly && isLoggedIn) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
