<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from '@/lib/axios' // instance axios yg sudah ada baseURL & interceptor

// ─── Route params ─────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

// Ambil dari route params: /reader/:orderId/:bookId
const orderId = computed(() => Number(route.params.orderId))
const bookId = computed(() => Number(route.params.bookId))

// ─── State ────────────────────────────────────────────────────────────────
const state = ref('loading') // 'loading' | 'ready' | 'error' | 'expired'
const errorMsg = ref('')
const pdfStreamUrl = ref('')
const bookTitle = ref('')
const bookAuthor = ref('')
const coverSrc = ref('')
const sidebarOpen = ref(false)
const refreshing = ref(false)

// Timer
const timeLeft = ref(300) // detik
let timerHandle = null
let tokenExpiry = null

// ─── Methods ──────────────────────────────────────────────────────────────

/**
 * Minta token dari backend, lalu set iframe src.
 */
async function requestToken() {
  refreshing.value = true
  state.value = 'loading'
  pdfStreamUrl.value = ''

  try {
    const { data } = await axios.post(`/orders/${orderId.value}/pdf-token/${bookId.value}`)

    const token = data.token
    bookTitle.value = data.book_title || bookTitle.value
    tokenExpiry = new Date(data.expires_at)

    // Hitung sisa waktu
    timeLeft.value = Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000))

    // URL stream PDF — token sebagai query param, bukan path
    // Backend ada di /pdf/view?token=xxx (web route, bukan api)
    pdfStreamUrl.value = `${import.meta.env.VITE_APP_URL}/pdf/view?token=${token}`

    state.value = 'ready'
    startTimer()
  } catch (err) {
    const msg = err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.'
    errorMsg.value = msg
    state.value = 'error'
  } finally {
    refreshing.value = false
  }
}

/**
 * Countdown timer — ketika habis, set state 'expired'.
 */
function startTimer() {
  if (timerHandle) clearInterval(timerHandle)
  timerHandle = setInterval(() => {
    timeLeft.value = Math.max(0, Math.floor((tokenExpiry - Date.now()) / 1000))
    if (timeLeft.value <= 0) {
      clearInterval(timerHandle)
      state.value = 'expired'
      pdfStreamUrl.value = ''
    }
  }, 1000)
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

function goBack() {
  router.push(`/orders/${orderId.value}`)
}

function onIframeLoad() {
  // iframe berhasil load PDF
  console.log('PDF loaded')
}

function onIframeError() {
  // Jika iframe gagal load (token invalid, dsb)
  state.value = 'error'
  errorMsg.value = 'Gagal memuat PDF. Token mungkin sudah kedaluwarsa.'
}

// ─── Lifecycle ────────────────────────────────────────────────────────────

onMounted(async () => {
  try {
    const { data } = await axios.get(`/orders/${orderId.value}`)
    const item = data.data?.items?.find((i) => i.book?.id === bookId.value && i.type === 'pdf')

    if (!item) {
      // Tidak punya akses → redirect ke pesanan
      router.replace(`/orders/${orderId.value}`)
      return
    }

    bookTitle.value = item.book?.title || ''
    bookAuthor.value = item.book?.author || ''
    coverSrc.value = item.book?.cover || ''
  } catch {
    // Order tidak ditemukan atau bukan milik user → redirect ke dashboard
    router.replace('/dashboard')
    return
  }

  await requestToken()
})

onUnmounted(() => {
  if (timerHandle) clearInterval(timerHandle)
  // Bersihkan URL object jika ada
  pdfStreamUrl.value = ''
})
</script>
<template>
  <div class="pdf-reader-shell" :class="{ 'sidebar-open': sidebarOpen }">
    <!-- ═══════════════════════════════════════════════════════
         TOPBAR
    ═══════════════════════════════════════════════════════ -->
    <header class="reader-topbar">
      <div class="topbar-left">
        <button class="icon-btn" @click="goBack" title="Kembali">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div class="book-meta">
          <span class="book-label">📄 E-Book</span>
          <span class="book-title">{{ bookTitle || 'Memuat...' }}</span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Timer token -->
        <div class="token-timer" :class="{ warning: timeLeft <= 60, expired: timeLeft <= 0 }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span v-if="timeLeft > 0">{{ formatTime(timeLeft) }}</span>
          <span v-else>Expired</span>
        </div>

        <!-- Refresh token -->
        <button
          v-if="timeLeft <= 60 || timeLeft <= 0"
          class="refresh-btn"
          @click="requestToken"
          :disabled="refreshing"
        >
          <svg
            :class="{ spinning: refreshing }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          {{ refreshing ? 'Memperbarui...' : 'Perbarui Akses' }}
        </button>

        <button class="icon-btn" @click="sidebarOpen = !sidebarOpen" title="Info Buku">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════
         BODY
    ═══════════════════════════════════════════════════════ -->
    <div class="reader-body">
      <!-- Loading state -->
      <div v-if="state === 'loading'" class="reader-center">
        <div class="loader-ring"></div>
        <p class="loader-text">Menyiapkan dokumen...</p>
        <p class="loader-sub">Memvalidasi akses & mengambil file</p>
      </div>

      <!-- Error state -->
      <div v-else-if="state === 'error'" class="reader-center">
        <div class="error-icon">🔒</div>
        <h2 class="error-title">Akses Ditolak</h2>
        <p class="error-msg">{{ errorMsg }}</p>
        <div class="error-actions">
          <button class="btn-primary" @click="requestToken">Coba Lagi</button>
          <button class="btn-ghost" @click="goBack">Kembali ke Pesanan</button>
        </div>
      </div>

      <!-- Expired state -->
      <div v-else-if="state === 'expired'" class="reader-center">
        <div class="error-icon">⏱️</div>
        <h2 class="error-title">Sesi Habis</h2>
        <p class="error-msg">
          Token akses sudah kedaluwarsa. Klik tombol di bawah untuk memperbarui.
        </p>
        <button class="btn-primary" @click="requestToken" :disabled="refreshing">
          {{ refreshing ? 'Memperbarui...' : '🔄 Perbarui Akses' }}
        </button>
      </div>

      <!-- PDF Viewer -->
      <div v-else-if="state === 'ready'" class="viewer-wrapper">
        <!--
          PENTING: iframe dipakai karena PDF.js embed langsung tanpa download link.
          URL bukan langsung ke file, tapi ke endpoint stream yang validasi token.
          Pengguna tidak bisa tahu path asli file PDF.
        -->
        <iframe
          ref="pdfFrame"
          :src="pdfStreamUrl"
          class="pdf-iframe"
          frameborder="0"
          allowfullscreen
          title="PDF Viewer"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>

        <!-- Overlay pencegah klik-kanan / drag (semi-protection) -->
        <div class="pdf-overlay" @contextmenu.prevent @dragstart.prevent></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         SIDEBAR INFO
    ═══════════════════════════════════════════════════════ -->
    <Transition name="sidebar-slide">
      <aside v-if="sidebarOpen" class="reader-sidebar">
        <div class="sidebar-header">
          <span>Info Buku</span>
          <button class="icon-btn small" @click="sidebarOpen = false">✕</button>
        </div>
        <div class="sidebar-body">
          <div class="sidebar-cover">
            <img v-if="coverSrc" :src="coverSrc" alt="Cover" />
            <div v-else class="cover-placeholder">📚</div>
          </div>
          <h3 class="sidebar-book-title">{{ bookTitle }}</h3>
          <p class="sidebar-book-author">{{ bookAuthor }}</p>
          <div class="sidebar-divider"></div>
          <div class="sidebar-info-row">
            <span>Format</span>
            <span class="chip purple">PDF</span>
          </div>
          <div class="sidebar-info-row">
            <span>ID Pesanan</span>
            <span class="chip mono">#{{ orderId }}</span>
          </div>
          <div class="sidebar-info-row">
            <span>Status Token</span>
            <span :class="['chip', timeLeft > 60 ? 'green' : 'orange']">
              {{ timeLeft > 0 ? formatTime(timeLeft) : 'Expired' }}
            </span>
          </div>
          <div class="sidebar-notice">
            <p>⚠️ Dokumen ini dilindungi hak cipta. Dilarang mendistribusikan tanpa izin.</p>
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   PDF READER — Layout Shell
═══════════════════════════════════════════════════════════════ */

.pdf-reader-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: #0f1117;
  color: #e5e7eb;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  overflow: hidden;
  position: relative;
}

/* ─── Topbar ────────────────────────────────────────────── */
.reader-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  height: 52px;
  background: #16181f;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 30;
  flex-shrink: 0;
}

.topbar-left,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.06);
  color: #9ca3af;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.icon-btn svg {
  width: 16px;
  height: 16px;
}
.icon-btn.small {
  width: 28px;
  height: 28px;
}

.book-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.book-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  font-weight: 600;
}
.book-title {
  font-size: 13px;
  font-weight: 700;
  color: #f3f4f6;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Token Timer ───────────────────────────────────────── */
.token-timer {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #6ee7b7;
  background: rgba(110, 231, 183, 0.1);
  border: 1px solid rgba(110, 231, 183, 0.2);
  border-radius: 8px;
  padding: 4px 10px;
  transition: all 0.3s;
}
.token-timer svg {
  width: 13px;
  height: 13px;
}
.token-timer.warning {
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.25);
  animation: pulse-warn 1s ease-in-out infinite;
}
.token-timer.expired {
  color: #f87171;
  background: rgba(248, 113, 113, 0.1);
  border-color: rgba(248, 113, 113, 0.25);
}

@keyframes pulse-warn {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.65;
  }
}

/* ─── Refresh btn ───────────────────────────────────────── */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #f59e0b;
  color: #1c1917;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.1s;
}
.refresh-btn:hover {
  background: #fbbf24;
}
.refresh-btn:active {
  transform: scale(0.96);
}
.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.refresh-btn svg {
  width: 13px;
  height: 13px;
}
.spinning {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ─── Reader Body ───────────────────────────────────────── */
.reader-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
}

/* ─── Center States (loading/error) ────────────────────── */
.reader-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  gap: 0.75rem;
}

.loader-ring {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
.loader-text {
  font-size: 15px;
  font-weight: 700;
  color: #e5e7eb;
  margin: 0;
}
.loader-sub {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 4px;
}
.error-title {
  font-size: 20px;
  font-weight: 800;
  color: #f3f4f6;
  margin: 0;
}
.error-msg {
  font-size: 13px;
  color: #9ca3af;
  max-width: 320px;
  line-height: 1.6;
  margin: 0;
}
.error-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}

.btn-primary {
  padding: 10px 20px;
  border-radius: 10px;
  background: #6366f1;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-primary:hover {
  background: #4f46e5;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-ghost {
  padding: 10px 20px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #9ca3af;
  font-weight: 700;
  font-size: 13px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: background 0.15s;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* ─── PDF Viewer ────────────────────────────────────────── */
.viewer-wrapper {
  flex: 1;
  position: relative;
  background: #252830;
}
.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
/* Overlay transparan di atas iframe — cegah klik kanan & drag langsung dari wrapper */
/* Note: overlay di atas iframe tidak bisa cegah klik DALAM iframe (cross-origin),
   tapi karena same-origin kita bisa handle via CSS pointer-events di iframe itu sendiri. */
.pdf-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none; /* biarkan scroll tetap jalan */
  user-select: none;
  -webkit-user-drag: none;
}

/* ─── Sidebar ───────────────────────────────────────────── */
.reader-sidebar {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 280px;
  background: #16181f;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  z-index: 20;
  overflow-y: auto;
}
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  font-weight: 700;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}
.sidebar-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.sidebar-cover {
  text-align: center;
  margin-bottom: 0.5rem;
}
.sidebar-cover img {
  max-height: 160px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  object-fit: cover;
}
.cover-placeholder {
  width: 100px;
  height: 140px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto;
}
.sidebar-book-title {
  font-size: 15px;
  font-weight: 800;
  color: #f3f4f6;
  margin: 0;
  text-align: center;
}
.sidebar-book-author {
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
  margin: 0;
}
.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 0.25rem 0;
}
.sidebar-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}
.chip {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}
.chip.purple {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}
.chip.green {
  background: rgba(110, 231, 183, 0.12);
  color: #6ee7b7;
}
.chip.orange {
  background: rgba(251, 191, 36, 0.12);
  color: #fbbf24;
}
.chip.mono {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.06);
  color: #9ca3af;
}

.sidebar-notice {
  margin-top: 0.5rem;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 10px;
  padding: 0.75rem;
  font-size: 11px;
  color: #f87171;
  line-height: 1.5;
}

/* ─── Transitions ───────────────────────────────────────── */
.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* ─── Responsive ────────────────────────────────────────── */
@media (max-width: 640px) {
  .reader-sidebar {
    width: 100%;
    border-left: none;
  }
  .book-title {
    max-width: 130px;
  }
  .token-timer span {
    display: none;
  }
  .token-timer {
    padding: 4px 8px;
  }
}
</style>
