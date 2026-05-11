<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/lib/axios'
import DOMPurify from 'dompurify'

function scrollToUpload() {
  document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })
}

const route = useRoute()
const router = useRouter()

// ── STATE ──
const order = ref(null)
const loading = ref(true)
const error = ref(null)

const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref(null)
const uploading = ref(false)
const uploadError = ref(null)
const uploadSuccess = ref(false)
const copied = ref(false)

// ── STATE DOWNLOAD ──
// Menyimpan loading state per book_id agar tidak semua tombol spinner bareng
const downloadingMap = ref({})

// ── CONSTANTS ──
const token = localStorage.getItem('token')
const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || '/storage'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// ── COMPUTED ──
const proofStatus = computed(() => order.value?.proof_status ?? 'not_uploaded')
const orderStatus = computed(() => order.value?.status ?? 'pending')

const isNotUploaded = computed(() => proofStatus.value === 'not_uploaded')
const isUploaded = computed(() => proofStatus.value === 'uploaded')
const isVerified = computed(() => proofStatus.value === 'verified')
const isInvalid = computed(() => proofStatus.value === 'invalid')
const isCash = computed(() => order.value?.payment_method?.code === 'cash')

const currentStep = computed(() => {
  if (isVerified.value) return 3
  if (isUploaded.value) return 2
  return 1
})

const pdfItems = computed(() => order.value?.items?.filter((i) => i.type === 'pdf') ?? [])
const printItems = computed(() => order.value?.items?.filter((i) => i.type === 'print') ?? [])

const needsUpload = computed(() => !isCash.value && isNotUploaded.value)

const orderStatusInfo = computed(() => {
  const map = {
    pending: {
      label: 'Menunggu Pembayaran',
      cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    processing: { label: 'Diproses', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    confirmed: { label: 'Dikonfirmasi', cls: 'bg-green-100 text-green-700 border-green-200' },
    shipped: { label: 'Dikirim', cls: 'bg-purple-100 text-purple-700 border-purple-200' },
    completed: { label: 'Selesai', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
    rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700 border-red-200' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  }
  return (
    map[orderStatus.value] ?? {
      label: orderStatus.value,
      cls: 'bg-gray-100 text-gray-600 border-gray-200',
    }
  )
})

const proofStatusInfo = computed(() => {
  const map = {
    not_uploaded: { label: 'Belum Upload Bukti', cls: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
    uploaded: { label: 'Sedang Ditinjau', cls: 'bg-blue-100 text-blue-700', icon: '🔍' },
    verified: { label: 'Bukti Diverifikasi', cls: 'bg-green-100 text-green-700', icon: '✅' },
    invalid: { label: 'Bukti Ditolak', cls: 'bg-red-100 text-red-700', icon: '❌' },
  }
  return (
    map[proofStatus.value] ?? {
      label: proofStatus.value,
      cls: 'bg-gray-100 text-gray-600',
      icon: '📦',
    }
  )
})

// ── HELPERS ──
const sanitize = (html) => (!html ? '' : DOMPurify.sanitize(html))
const formatPrice = (price) => 'Rp ' + Number(price ?? 0).toLocaleString('id-ID')
const formatDate = (d) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
const getCoverSrc = (cover) => {
  if (!cover) return null
  return cover.startsWith('http') ? cover : `${STORAGE_URL}/${cover}`
}
const getProofSrc = (proof) => {
  if (!proof) return null
  return proof.startsWith('http') ? proof : `${STORAGE_URL}/${proof}`
}
const getItemSubtotal = (item) => Number(item.price ?? 0) * Number(item.qty ?? 1)

// ── DOWNLOAD (AMAN) ──────────────────────────────────────────────────────────
//
// Alur:
//   1. GET /orders/{order}/download-link/{book}
//      → axios otomatis attach Bearer token dari interceptor
//      → backend cek: login? milik user ini? status confirmed? pdf ada di order?
//   2. Dapat { url: "https://api.../download?signature=...&uid=xxx&expires=..." }
//   3. window.location.href = url → browser download PDF langsung
//
// Kenapa TIDAK pakai axios responseType blob di sini?
//   Karena download route sudah menghasilkan file stream dari Storage::download()
//   — lebih efisien dibuka langsung oleh browser dari signed URL yang sudah
//   diikat ke uid user. Signed URL expire 5 menit (lihat DownloadController).
//
async function handleDownload(item) {
  const bookId = item.book_id ?? item.book?.id
  if (!bookId) return

  // Cegah double klik
  if (downloadingMap.value[bookId]) return
  downloadingMap.value[bookId] = true

  try {
    // Step 1: Minta signed URL dari backend (butuh Bearer token via axios)
    const { data } = await api.get(`/orders/${order.value.id}/download-link/${bookId}`)
    const signedUrl = data?.url

    if (!signedUrl) throw new Error('URL tidak tersedia.')

    // Step 2: Buka signed URL → browser otomatis download PDF
    // Signed URL sudah mengandung signature + uid + expires dari Laravel
    window.location.href = signedUrl
  } catch (err) {
    const status = err.response?.status
    const msg = err.response?.data?.message

    if (status === 401) {
      // Belum login — arahkan ke login
      router.push({ path: '/login', query: { redirect: route.fullPath } })
      return
    }

    if (status === 403) {
      // Akses ditolak — tampilkan pesan dari backend
      alert(`⛔ Akses Ditolak\n\n${msg || 'Kamu tidak memiliki akses ke file ini.'}`)
      return
    }

    if (status === 404) {
      alert(`📭 File Tidak Ditemukan\n\n${msg || 'File PDF belum tersedia. Hubungi admin.'}`)
      return
    }

    alert(`❌ Gagal mengunduh\n\n${msg || 'Terjadi kesalahan. Coba beberapa saat lagi.'}`)
  } finally {
    // Delay sedikit agar tombol tidak langsung aktif kembali
    setTimeout(() => {
      downloadingMap.value[bookId] = false
    }, 2000)
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ── ACTIONS ──
async function copyNorek() {
  const norek = order.value?.payment_method?.account_number
  if (!norek) return
  try {
    await navigator.clipboard.writeText(norek)
  } catch {
    const el = document.createElement('textarea')
    el.value = norek
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

async function fetchOrder(retries = 3) {
  loading.value = true
  error.value = null
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await api.get(`/orders/${route.params.id}`)
      order.value = data.data ?? data
      loading.value = false
      return
    } catch (err) {
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
      } else {
        error.value = err.response?.data?.message ?? 'Gagal memuat detail pesanan.'
      }
    }
  }
  loading.value = false
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  if (file.size > MAX_FILE_SIZE) {
    uploadError.value = 'Ukuran file terlalu besar (Maks 5MB)'
    if (fileInput.value) fileInput.value.value = ''
    return
  }
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  uploadError.value = null
}

function triggerFilePicker() {
  fileInput.value?.click()
}

function removeFile() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  selectedFile.value = null
  previewUrl.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function uploadBukti() {
  if (!selectedFile.value) {
    uploadError.value = 'Pilih file terlebih dahulu.'
    return
  }
  uploading.value = true
  uploadError.value = null
  const formData = new FormData()
  formData.append('payment_proof', selectedFile.value)
  try {
    await api.post(`/orders/${order.value.id}/payment`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    uploadSuccess.value = true
    removeFile()
    await fetchOrder()
  } catch (err) {
    uploadError.value = err.response?.data?.message ?? 'Gagal mengupload. Coba lagi.'
  } finally {
    uploading.value = false
  }
}

function printInvoice() {
  window.print()
}

// ── LIFECYCLE ──
onMounted(() => {
  if (!token) {
    router.push('/login')
    return
  }
  fetchOrder()
})

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})

watch(
  () => order.value,
  (val) => {
    if (val && route.query.tab === 'upload') {
      setTimeout(() => {
        document.getElementById('upload-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  },
)
</script>

<template>
  <div class="relative min-h-screen overflow-hidden print:bg-white">
    <div class="absolute inset-0 pointer-events-none grid-bg print:hidden"></div>

    <!-- MODAL: Upload Sukses -->
    <Transition name="fade">
      <div
        v-if="uploadSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center px-4 print:hidden"
        @click.self="uploadSuccess = false"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-pop"
        >
          <div
            class="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 class="text-lg font-bold text-gray-800 mb-1">Bukti Berhasil Diupload! 📤</h2>
          <p class="text-sm text-gray-500 mb-6">
            Bukti pembayaranmu sedang kami tinjau. Harap tunggu konfirmasi dari admin.
          </p>
          <button
            @click="uploadSuccess = false"
            class="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition"
          >
            Oke, Mengerti
          </button>
        </div>
      </div>
    </Transition>

    <div class="relative max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-16 print:px-0 print:pt-0">
      <!-- Back -->
      <button
        @click="router.push('/orders')"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition group mb-6 print:hidden"
      >
        <svg
          class="w-4 h-4 group-hover:-translate-x-1 transition-transform"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Kembali ke Pesanan Saya
      </button>

      <!-- Skeleton -->
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-8 rounded w-1/2 mb-6"></div>
        <div class="bg-white/80 rounded-2xl p-6 space-y-4">
          <div class="skeleton h-4 rounded w-1/3"></div>
          <div class="skeleton h-20 rounded-xl"></div>
          <div class="skeleton h-12 rounded-xl"></div>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-col items-center py-24 text-center">
        <p class="text-4xl mb-3">⚠️</p>
        <p class="text-gray-600">{{ error }}</p>
        <button
          @click="fetchOrder()"
          class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
        >
          Coba Lagi
        </button>
      </div>

      <template v-else-if="order">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-start print:mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Detail Pesanan</h1>
            <p class="text-sm text-gray-500 mt-1 font-mono">
              {{ order.order_code || `#INV-${String(order.id).padStart(4, '0')}` }}
            </p>
          </div>
          <button
            @click="printInvoice"
            class="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition print:hidden"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1 1 0 01-1.006 1.086H7.121a1 1 0 01-1.006-1.086L6.34 18"
              />
            </svg>
            Print
          </button>
        </div>

        <!-- STEPPER -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 print:shadow-none"
        >
          <div class="flex items-center">
            <div class="flex flex-col items-center gap-1 flex-1">
              <div
                :class="[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                  currentStep >= 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-gray-100 text-gray-400 border-gray-200',
                ]"
              >
                1
              </div>
              <p class="text-xs text-gray-500 font-medium">Pesan</p>
            </div>
            <div
              :class="['flex-1 h-0.5 mb-4', currentStep >= 2 ? 'bg-blue-400' : 'bg-gray-200']"
            ></div>
            <div class="flex flex-col items-center gap-1 flex-1">
              <div
                :class="[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                  isInvalid
                    ? 'bg-red-500 text-white border-red-500'
                    : currentStep >= 2
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-400 border-gray-200',
                ]"
              >
                2
              </div>
              <p class="text-xs text-gray-500 font-medium">Pembayaran</p>
            </div>
            <div
              :class="['flex-1 h-0.5 mb-4', currentStep >= 3 ? 'bg-blue-400' : 'bg-gray-200']"
            ></div>
            <div class="flex flex-col items-center gap-1 flex-1">
              <div
                :class="[
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                  currentStep >= 3
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-100 text-gray-400 border-gray-200',
                ]"
              >
                3
              </div>
              <p class="text-xs text-gray-500 font-medium">Diverifikasi</p>
            </div>
          </div>
          <div class="mt-4 flex justify-center">
            <span
              :class="[
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
                proofStatusInfo.cls,
              ]"
            >
              {{ proofStatusInfo.icon }} {{ proofStatusInfo.label }}
            </span>
          </div>
        </div>

        <!-- BANNER UPLOAD -->
        <Transition name="slide-fade">
          <div v-if="needsUpload" class="relative mb-4 rounded-2xl overflow-hidden print:hidden">
            <div
              class="absolute inset-0 bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-400 animate-gradient-x opacity-90 rounded-2xl"
            ></div>
            <div class="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none">
              <div class="relative">
                <div
                  class="w-16 h-16 rounded-full border-4 border-white/40 animate-ping-md absolute inset-0"
                ></div>
                <div
                  class="w-16 h-16 rounded-full border-4 border-white/20 animate-ping-lg absolute inset-0"
                ></div>
              </div>
            </div>
            <div class="relative p-5 flex items-center gap-4">
              <div
                class="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0 animate-bounce-slow"
              >
                <span class="text-2xl">📤</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-white font-bold text-base">Upload Bukti Pembayaran!</p>
                <p class="text-white/80 text-xs mt-0.5">
                  Pesananmu menunggu konfirmasi. Upload sekarang agar cepat diproses.
                </p>
              </div>
              <button
                type="button"
                @click="scrollToUpload"
                class="shrink-0 px-4 py-2 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50 transition active:scale-95 shadow-md"
              >
                Upload →
              </button>
            </div>
          </div>
        </Transition>

        <!-- DAFTAR BUKU -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 print:shadow-none"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Buku yang Dipesan ({{ order.items?.length || 0 }})
            </h2>
            <span
              :class="[
                'px-2 py-1 rounded-lg text-[10px] font-bold uppercase border',
                orderStatusInfo.cls,
              ]"
            >
              {{ orderStatusInfo.label }}
            </span>
          </div>
          <div class="space-y-4">
            <div
              v-for="(item, idx) in order.items"
              :key="idx"
              class="flex gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
            >
              <div class="shrink-0 w-14 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                <img
                  v-if="getCoverSrc(item.book?.cover)"
                  :src="getCoverSrc(item.book?.cover)"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-2xl">📚</div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <div class="min-w-0">
                    <p class="font-bold text-gray-800 text-sm truncate">{{ item.book?.title }}</p>
                    <p class="text-xs text-gray-500">{{ item.book?.author }}</p>
                  </div>
                  <span
                    :class="[
                      'shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase',
                      item.type === 'print'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-purple-100 text-purple-700',
                    ]"
                  >
                    {{ item.type === 'print' ? '📚 Cetak' : '📄 PDF' }}
                  </span>
                </div>
                <div class="flex justify-between items-end mt-2">
                  <p class="text-xs text-gray-400">
                    {{ item.qty }} × {{ formatPrice(item.price) }}
                  </p>
                  <p class="text-sm font-bold text-blue-600">
                    {{ formatPrice(getItemSubtotal(item)) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t-2 border-gray-100">
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold text-gray-700">Total Pembayaran</span>
              <span class="text-lg font-black text-blue-600">{{ formatPrice(order.total) }}</span>
            </div>
          </div>
        </div>

        <!-- RINCIAN PESANAN -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 print:shadow-none"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Rincian Pesanan
          </h2>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">ID Pesanan</span>
              <span class="font-mono font-bold text-blue-600">#{{ order.id }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Tanggal Pesan</span>
              <span class="text-gray-700 font-medium">{{ formatDate(order.created_at) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Metode Pembayaran</span>
              <span class="text-gray-700 font-medium flex items-center gap-1">
                <span>{{ isCash ? '💵' : '🏦' }}</span>
                {{ order.payment_method?.name || '-' }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Status Order</span>
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-semibold border',
                  orderStatusInfo.cls,
                ]"
                >{{ orderStatusInfo.label }}</span
              >
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Status Bukti</span>
              <span :class="['text-xs font-semibold', proofStatusInfo.cls]"
                >{{ proofStatusInfo.icon }} {{ proofStatusInfo.label }}</span
              >
            </div>
          </div>
        </div>

        <!-- REKENING BANK -->
        <div
          v-if="!isCash && isNotUploaded"
          class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm p-5 mb-4 print:hidden"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🏦</span>
            <div>
              <h2 class="text-sm font-bold text-gray-800">Transfer ke Rekening Berikut</h2>
              <p class="text-xs text-gray-500">Selesaikan pembayaran sebelum upload bukti</p>
            </div>
          </div>
          <div class="bg-white rounded-xl p-4 space-y-3 shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-400 uppercase tracking-wider">Bank</span>
              <span class="text-sm font-bold text-gray-800">{{
                order.payment_method?.bank_name || order.payment_method?.name
              }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-400 uppercase tracking-wider">Atas Nama</span>
              <span class="text-sm font-semibold text-gray-800">{{
                order.payment_method?.account_name || '-'
              }}</span>
            </div>
            <div class="flex justify-between items-center pt-2 border-t border-gray-100">
              <span class="text-xs text-gray-400 uppercase tracking-wider">No. Rekening</span>
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-blue-700 tracking-wider font-mono">{{
                  order.payment_method?.account_number || '-'
                }}</span>
                <button
                  v-if="order.payment_method?.account_number"
                  @click="copyNorek"
                  :class="[
                    'text-xs px-3 py-1.5 rounded-lg font-bold transition-all',
                    copied
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-600',
                  ]"
                >
                  {{ copied ? '✓ Disalin!' : 'Salin' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- CASH INFO -->
        <div
          v-if="isCash"
          class="bg-green-50 rounded-2xl border border-green-200 shadow-sm p-5 mb-4 print:hidden"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl">💵</span>
            <div>
              <h2 class="text-sm font-bold text-green-800 mb-1">Pembayaran Tunai</h2>
              <p class="text-xs text-green-600 leading-relaxed">
                Anda memilih pembayaran tunai. Silakan datang ke
                <strong>Bagian Akademik</strong> untuk melakukan pembayaran dan mengambil buku.
              </p>
              <div class="mt-3 bg-white rounded-xl px-4 py-3 inline-block border border-green-200">
                <p class="text-xs text-green-500 mb-0.5">ID Pesanan</p>
                <p class="font-mono font-bold text-green-700 tracking-widest text-lg">
                  #{{ order.id }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- UPLOAD SECTION -->
        <div
          v-if="isNotUploaded && !isCash"
          id="upload-section"
          class="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-orange-200 shadow-sm p-5 mb-4 print:hidden"
        >
          <div class="flex items-center gap-2 mb-4">
            <div class="relative">
              <span class="text-xl">📤</span>
              <span
                class="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-ping"
              ></span>
            </div>
            <div>
              <h2 class="text-sm font-bold text-gray-800">Upload Bukti Pembayaran</h2>
              <p class="text-xs text-gray-500">
                Lakukan transfer lalu upload foto buktinya di sini
              </p>
            </div>
          </div>
          <div
            @click="triggerFilePicker"
            :class="[
              'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              previewUrl
                ? 'border-blue-300 bg-blue-50/50'
                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30',
            ]"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              class="hidden"
              @change="onFileChange"
            />
            <div v-if="previewUrl" class="relative">
              <img :src="previewUrl" class="max-h-48 mx-auto rounded-lg shadow-sm object-contain" />
              <button
                @click.stop="removeFile"
                class="absolute top-1 right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition shadow-md"
              >
                ✕
              </button>
              <p class="text-xs text-gray-500 mt-2 truncate font-medium">
                {{ selectedFile?.name }}
              </p>
              <p class="text-[10px] text-gray-400">
                {{ (selectedFile?.size / 1024 / 1024).toFixed(2) }} MB
              </p>
            </div>
            <div v-else>
              <div
                class="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <svg
                  class="w-6 h-6 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p class="text-sm font-medium text-gray-600">Klik untuk pilih foto bukti transfer</p>
              <p class="text-xs text-gray-400 mt-1">JPG, PNG • Maks 5MB</p>
            </div>
          </div>
          <p v-if="uploadError" class="mt-3 text-xs text-red-500 flex items-center gap-1">
            <span>⚠️</span> {{ uploadError }}
          </p>
          <button
            @click="uploadBukti"
            :disabled="!selectedFile || uploading"
            :class="[
              'mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
              selectedFile && !uploading
                ? 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            ]"
          >
            <svg v-if="uploading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            {{ uploading ? 'Mengupload...' : '📤 Upload Bukti Pembayaran' }}
          </button>
        </div>

        <!-- UPLOADED: Sedang Ditinjau -->
        <div
          v-if="isUploaded"
          class="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4 print:hidden"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-0.5">🔍</span>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm font-bold text-blue-800 mb-1">Bukti Sedang Ditinjau Admin</h2>
              <p class="text-xs text-blue-600 mb-4">
                Admin sedang memverifikasi bukti pembayaranmu. Biasanya memakan waktu 1×24 jam.
              </p>
              <div
                v-if="getProofSrc(order.payment_proof)"
                class="bg-white rounded-xl p-3 border border-blue-100"
              >
                <p class="text-xs font-semibold text-blue-700 mb-2">Bukti yang kamu upload:</p>
                <a :href="getProofSrc(order.payment_proof)" target="_blank" class="block">
                  <img
                    :src="getProofSrc(order.payment_proof)"
                    class="max-h-40 rounded-xl shadow-sm object-contain mx-auto hover:opacity-90 transition"
                  />
                  <p class="text-xs text-blue-500 mt-2 flex items-center justify-center gap-1">
                    <svg
                      class="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Lihat ukuran penuh
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- INVALID: Ditolak Admin -->
        <div
          v-if="isInvalid"
          class="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4 shadow-sm print:hidden"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-0.5 animate-bounce">❌</span>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm font-bold text-red-800 mb-1">Bukti Pembayaran Ditolak</h2>
              <div
                v-if="order.proof_note"
                class="bg-red-100 border border-red-200 rounded-xl px-4 py-3 mb-4"
              >
                <p class="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">
                  Catatan dari Admin:
                </p>
                <div
                  class="text-sm text-red-600 break-words leading-relaxed"
                  v-html="sanitize(order.proof_note)"
                ></div>
              </div>
              <p class="text-xs text-red-500 mb-4 font-medium italic">
                * Harap unggah kembali foto bukti transfer yang lebih jelas.
              </p>
              <div
                @click="triggerFilePicker"
                class="border-2 border-dashed border-red-200 rounded-xl p-4 text-center cursor-pointer hover:border-red-400 hover:bg-red-100/30 transition-all group bg-white"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  class="hidden"
                  @change="onFileChange"
                />
                <div v-if="previewUrl">
                  <img
                    :src="previewUrl"
                    class="max-h-36 mx-auto rounded-lg object-contain mb-2 shadow-md"
                  />
                  <p class="text-xs text-gray-500 truncate">{{ selectedFile?.name }}</p>
                </div>
                <div v-else>
                  <p
                    class="text-sm font-bold text-red-500 group-hover:scale-105 transition-transform"
                  >
                    📎 Pilih Bukti Baru
                  </p>
                  <p class="text-[10px] text-red-400 mt-1 uppercase">Format: JPG, PNG (Maks 5MB)</p>
                </div>
              </div>
              <p
                v-if="uploadError"
                class="mt-3 text-xs text-red-600 font-bold flex items-center gap-1"
              >
                <span>⚠️</span> {{ uploadError }}
              </p>
              <button
                @click="uploadBukti"
                :disabled="!selectedFile || uploading"
                :class="[
                  'mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg',
                  selectedFile && !uploading
                    ? 'bg-red-600 text-white hover:bg-red-700 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                ]"
              >
                <svg v-if="uploading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                {{ uploading ? 'Sedang Mengirim...' : '🔄 Upload Ulang Sekarang' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════════════ -->
        <!-- VERIFIED: Pembayaran Diterima                                     -->
        <!-- ══════════════════════════════════════════════════════════════════ -->
        <div
          v-if="isVerified"
          class="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 print:hidden"
        >
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-0.5">🎉</span>
            <div class="flex-1 min-w-0">
              <h2 class="text-sm font-bold text-green-800 mb-1">Pembayaran Diverifikasi!</h2>
              <p class="text-sm text-green-600 mb-4">
                Bukti pembayaranmu telah diterima dan diverifikasi oleh admin.
              </p>

              <!-- Print Items -->
              <div
                v-if="printItems.length > 0"
                class="bg-white rounded-xl border border-green-200 p-4 mb-4"
              >
                <div class="flex items-start gap-2">
                  <span class="text-lg mt-0.5">🏛️</span>
                  <div>
                    <p class="text-sm font-bold text-green-800">Ambil Buku di Bagian Akademik</p>
                    <p class="text-xs text-green-700 mt-1 leading-relaxed">
                      Silakan datang ke <span class="font-semibold">Bagian Akademik</span> dan
                      tunjukkan nomor pesanan:
                    </p>
                    <div
                      class="mt-3 bg-green-50 rounded-xl px-4 py-2.5 inline-block border border-green-200"
                    >
                      <p class="text-xs text-green-500 mb-0.5">ID Pesanan</p>
                      <p class="font-mono font-bold text-green-700 tracking-widest text-lg">
                        #{{ order.id }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ✅ PDF Items — Download via handleDownload (AMAN) -->
              <div
                v-if="pdfItems.length > 0"
                class="bg-white rounded-xl border border-green-200 p-4 mb-4"
              >
                <div class="flex items-start gap-2">
                  <span class="text-lg mt-0.5 shrink-0">📄</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-green-800">Download E-Book PDF</p>
                    <p class="text-xs text-green-700 mb-3">Buku digitalmu sudah siap didownload:</p>
                    <div class="space-y-2">
                      <button
                        v-for="item in pdfItems"
                        :key="item.id"
                        @click="handleDownload(item)"
                        :disabled="downloadingMap[item.book_id ?? item.book?.id]"
                        class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition active:scale-95 w-full overflow-hidden bg-green-600 text-white hover:bg-green-700 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                      >
                        <!-- Spinner saat loading, ikon download saat idle -->
                        <svg
                          v-if="downloadingMap[item.book_id ?? item.book?.id]"
                          class="w-5 h-5 shrink-0 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          ></circle>
                          <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          ></path>
                        </svg>
                        <svg
                          v-else
                          class="w-5 h-5 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                          />
                        </svg>
                        <div class="flex-1 min-w-0 overflow-hidden text-left">
                          <p class="truncate leading-tight">{{ item.book?.title ?? item.title }}</p>
                          <p class="text-[10px] font-normal opacity-80 truncate">
                            {{
                              downloadingMap[item.book_id ?? item.book?.id]
                                ? 'Menyiapkan link...'
                                : 'Klik untuk download'
                            }}
                          </p>
                        </div>
                      </button>
                    </div>
                    <p class="text-[10px] text-green-600 mt-3 flex items-center gap-1">
                      <svg
                        class="w-3 h-3 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 9v4m0 4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
                      </svg>
                      Link aktif selama 5 menit. Download langsung dimulai setelah klik.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Bukti proof image -->
              <div v-if="getProofSrc(order.payment_proof)" class="mt-4">
                <p class="text-xs font-semibold text-green-700 mb-2">Bukti yang diterima:</p>
                <a :href="getProofSrc(order.payment_proof)" target="_blank">
                  <img
                    :src="getProofSrc(order.payment_proof)"
                    class="max-h-40 rounded-xl shadow-sm object-contain border border-green-200 hover:opacity-90 transition"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Print footer -->
        <div class="hidden print:block mt-8 pt-8 border-t border-gray-300">
          <p class="text-center text-xs text-gray-500">
            Terima kasih telah berbelanja di Unival Store.<br />
            Untuk bantuan, hubungi admin@unival.store
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.grid-bg {
  background:
    linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
  background-size: 40px 40px;
}
.skeleton {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
  animation: bone 1.4s ease-in-out infinite;
}
@keyframes bone {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-fade-enter-active {
  transition: all 0.4s ease;
}
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.animate-pop {
  animation: pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
.animate-gradient-x {
  background-size: 200% 100%;
  animation: gradient-x 3s ease infinite;
}
@keyframes gradient-x {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
.animate-ping-md {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.animate-ping-lg {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) 0.5s infinite;
}
@keyframes ping {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
.animate-bounce-slow {
  animation: bounce-slow 2s ease-in-out infinite;
}
@keyframes bounce-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
@media print {
  .grid-bg {
    display: none !important;
  }
}
</style>
