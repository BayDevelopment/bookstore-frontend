<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const loading = ref(true)
const error = ref(null)

const fileInput = ref(null)
const selectedFile = ref(null)
const previewUrl = ref(null)
const uploading = ref(false)
const uploadError = ref(null)
const uploadSuccess = ref(false)

const token = localStorage.getItem('token')

async function fetchOrder() {
  loading.value = true
  error.value = null
  try {
    const { data } = await axios.get(`/api/orders/${route.params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    order.value = data.data ?? data
  } catch (e) {
    error.value = 'Gagal memuat detail pesanan.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!token) {
    router.push('/login')
    return
  }
  fetchOrder()
})

// ── proof_status: not_uploaded | uploaded | verified | invalid ──────────
// ── status      : pending | confirmed | rejected ────────────────────────
const proofStatus = computed(() => order.value?.proof_status ?? 'not_uploaded')
const orderStatus = computed(() => order.value?.status ?? 'pending')

const isNotUploaded = computed(() => proofStatus.value === 'not_uploaded')
const isUploaded = computed(() => proofStatus.value === 'uploaded')
const isVerified = computed(() => proofStatus.value === 'verified')
const isInvalid = computed(() => proofStatus.value === 'invalid')

const currentStep = computed(() => {
  if (isVerified.value) return 3
  if (isUploaded.value) return 2
  return 1
})

const orderStatusMap = {
  pending: { label: 'Menunggu', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Dikonfirmasi', cls: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700 border-red-200' },
}
const orderStatusInfo = computed(
  () =>
    orderStatusMap[orderStatus.value] ?? {
      label: orderStatus.value,
      cls: 'bg-gray-100 text-gray-600 border-gray-200',
    },
)

const proofStatusMap = {
  not_uploaded: { label: 'Belum Upload Bukti', cls: 'bg-yellow-100 text-yellow-700', icon: '⏳' },
  uploaded: { label: 'Sedang Ditinjau', cls: 'bg-blue-100 text-blue-700', icon: '🔍' },
  verified: { label: 'Bukti Diverifikasi', cls: 'bg-green-100 text-green-700', icon: '✅' },
  invalid: { label: 'Bukti Ditolak', cls: 'bg-red-100 text-red-700', icon: '❌' },
}
const proofStatusInfo = computed(
  () =>
    proofStatusMap[proofStatus.value] ?? {
      label: proofStatus.value,
      cls: 'bg-gray-100 text-gray-600',
      icon: '📦',
    },
)

const coverSrc = computed(() => {
  const c = order.value?.items?.[0]?.book?.cover
  if (!c) return null
  return c.startsWith('http') ? c : `/storage/${c}`
})
const proofSrc = computed(() => {
  const p = order.value?.payment_proof
  if (!p) return null
  return p.startsWith('http') ? p : `/storage/${p}`
})

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  uploadError.value = null
}
function triggerFilePicker() {
  fileInput.value?.click()
}
function removeFile() {
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
    await axios.post(`/api/orders/${order.value.id}/payment`, formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    })
    uploadSuccess.value = true
    selectedFile.value = null
    previewUrl.value = null
    await fetchOrder()
  } catch (e) {
    uploadError.value = e.response?.data?.message ?? 'Gagal mengupload. Coba lagi.'
  } finally {
    uploading.value = false
  }
}

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden">
    <div class="absolute inset-0 pointer-events-none grid-bg"></div>

    <!-- MODAL Upload Sukses -->
    <Transition name="fade">
      <div
        v-if="uploadSuccess"
        class="fixed inset-0 z-50 flex items-center justify-center px-4"
        @click.self="uploadSuccess = false"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
        <div
          class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-pop"
        >
          <div
            class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-blue-500"
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

    <div class="relative max-w-2xl mx-auto px-6 pt-8 pb-16">
      <!-- BACK -->
      <button
        @click="router.push('/orders')"
        class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition group mb-6"
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

      <!-- SKELETON -->
      <div v-if="loading" class="space-y-4">
        <div class="skeleton h-8 rounded w-1/2 mb-6"></div>
        <div class="bg-white/80 rounded-2xl p-6 space-y-4">
          <div class="skeleton h-4 rounded w-1/3"></div>
          <div class="skeleton h-20 rounded-xl"></div>
          <div class="skeleton h-12 rounded-xl"></div>
        </div>
      </div>

      <!-- ERROR -->
      <div v-else-if="error" class="flex flex-col items-center py-24 text-center">
        <p class="text-4xl mb-3">⚠️</p>
        <p class="text-gray-600">{{ error }}</p>
        <button
          @click="fetchOrder"
          class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full text-sm hover:bg-blue-700 transition"
        >
          Coba Lagi
        </button>
      </div>

      <template v-else-if="order">
        <!-- HEADER -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Detail Pesanan</h1>
          <p class="text-sm text-gray-500 mt-1 font-mono">#{{ order.id }}</p>
        </div>

        <!-- STEPPER -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
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

        <!-- INFO BUKU -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Buku yang Dipesan
          </h2>
          <div class="flex gap-4">
            <div class="shrink-0 w-14 h-20 rounded-xl overflow-hidden bg-gray-100 shadow-sm">
              <img v-if="coverSrc" :src="coverSrc" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-2xl">📚</div>
            </div>
            <div class="flex-1">
              <p class="font-bold text-gray-800">{{ order.items?.[0]?.book?.title }}</p>
              <p class="text-sm text-gray-500">{{ order.items?.[0]?.book?.author }}</p>
              <p class="text-blue-600 font-bold mt-2">
                Rp {{ Number(order.total ?? 0).toLocaleString('id-ID') }}
              </p>
            </div>
          </div>
        </div>

        <!-- RINCIAN -->
        <div
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm p-5 mb-4"
        >
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Rincian Pesanan
          </h2>
          <div class="space-y-2.5">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">ID Pesanan</span>
              <span class="font-mono font-bold text-blue-600">#{{ order.id }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Tanggal Pesan</span>
              <span class="text-gray-700 font-medium">{{ formatDate(order.created_at) }}</span>
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
            <hr class="border-gray-100" />
            <div class="flex justify-between text-sm font-bold">
              <span class="text-gray-700">Total Pembayaran</span>
              <span class="text-blue-600"
                >Rp {{ Number(order.total ?? 0).toLocaleString('id-ID') }}</span
              >
            </div>
          </div>
        </div>

        <!-- ── not_uploaded: Form Upload ── -->
        <div
          v-if="isNotUploaded"
          class="bg-white/80 backdrop-blur-md rounded-2xl border border-yellow-200 shadow-sm p-5 mb-4"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">⏳</span>
            <div>
              <h2 class="text-sm font-bold text-gray-800">Upload Bukti Pembayaran</h2>
              <p class="text-xs text-gray-500">Lakukan pembayaran lalu upload bukti transfer</p>
            </div>
          </div>
          <div
            @click="triggerFilePicker"
            :class="[
              'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
              previewUrl
                ? 'border-blue-300 bg-blue-50/50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30',
            ]"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*,.pdf"
              class="hidden"
              @change="onFileChange"
            />
            <div v-if="previewUrl" class="relative">
              <img :src="previewUrl" class="max-h-48 mx-auto rounded-lg shadow-sm object-contain" />
              <button
                @click.stop="removeFile"
                class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition"
              >
                ✕
              </button>
              <p class="text-xs text-gray-500 mt-2 truncate">{{ selectedFile?.name }}</p>
            </div>
            <div v-else>
              <div
                class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <svg
                  class="w-6 h-6 text-gray-400"
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
              <p class="text-sm font-medium text-gray-600">Klik untuk pilih file</p>
              <p class="text-xs text-gray-400 mt-1">JPG, PNG, atau PDF • Maks 5MB</p>
            </div>
          </div>
          <p v-if="uploadError" class="mt-2 text-xs text-red-500">⚠ {{ uploadError }}</p>
          <button
            @click="uploadBukti"
            :disabled="!selectedFile || uploading"
            :class="[
              'mt-4 w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
              selectedFile && !uploading
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
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

        <!-- ── uploaded: Sedang Ditinjau ── -->
        <div v-if="isUploaded" class="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-0.5">🔍</span>
            <div class="flex-1">
              <h2 class="text-sm font-bold text-blue-800 mb-1">Bukti Sedang Ditinjau Admin</h2>
              <p class="text-xs text-blue-600 mb-4">
                Admin sedang memverifikasi bukti pembayaranmu. Biasanya memakan waktu 1x24 jam.
              </p>
              <div v-if="proofSrc">
                <p class="text-xs font-semibold text-blue-700 mb-2">Bukti yang kamu upload:</p>
                <a :href="proofSrc" target="_blank" class="block">
                  <img
                    :src="proofSrc"
                    class="max-h-40 rounded-xl shadow-sm object-contain border border-blue-100 hover:opacity-90 transition"
                  />
                  <p class="text-xs text-blue-500 mt-1 flex items-center gap-1">
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

        <!-- ── invalid: Ditolak + Upload Ulang ── -->
        <div v-if="isInvalid" class="bg-red-50 border border-red-200 rounded-2xl p-5 mb-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-0.5">❌</span>
            <div class="flex-1">
              <h2 class="text-sm font-bold text-red-800 mb-1">Bukti Pembayaran Ditolak</h2>
              <!-- proof_note dari admin -->
              <div
                v-if="order.proof_note"
                class="bg-red-100 border border-red-200 rounded-xl px-4 py-3 mb-3"
              >
                <p class="text-xs font-semibold text-red-700 mb-1">Catatan dari Admin:</p>
                <p class="text-sm text-red-600">{{ order.proof_note }}</p>
              </div>
              <p class="text-xs text-red-500 mb-4">
                Silakan upload ulang bukti pembayaran yang valid.
              </p>
              <div
                @click="triggerFilePicker"
                class="border-2 border-dashed border-red-200 rounded-xl p-4 text-center cursor-pointer hover:border-red-300 transition"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*,.pdf"
                  class="hidden"
                  @change="onFileChange"
                />
                <div v-if="previewUrl">
                  <img :src="previewUrl" class="max-h-36 mx-auto rounded-lg object-contain mb-2" />
                  <p class="text-xs text-gray-500 truncate">{{ selectedFile?.name }}</p>
                </div>
                <div v-else>
                  <p class="text-sm font-medium text-red-500">📎 Pilih bukti baru</p>
                  <p class="text-xs text-red-400 mt-1">JPG, PNG, atau PDF • Maks 5MB</p>
                </div>
              </div>
              <p v-if="uploadError" class="mt-2 text-xs text-red-500">⚠ {{ uploadError }}</p>
              <button
                @click="uploadBukti"
                :disabled="!selectedFile || uploading"
                :class="[
                  'mt-3 w-full py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2',
                  selectedFile && !uploading
                    ? 'bg-red-500 text-white hover:bg-red-600'
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
                {{ uploading ? 'Mengupload...' : '🔄 Upload Ulang Bukti' }}
              </button>
            </div>
          </div>
        </div>

        <!-- ── verified: Diverifikasi ── -->
        <div v-if="isVerified" class="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
          <div class="flex items-start gap-3">
            <span class="text-2xl mt-0.5">🎉</span>
            <div class="flex-1">
              <h2 class="text-sm font-bold text-green-800 mb-1">Pembayaran Diverifikasi!</h2>
              <p class="text-sm text-green-600 mb-4">
                Bukti pembayaranmu telah diterima dan diverifikasi oleh admin.
              </p>
              <div class="bg-green-100 border border-green-300 rounded-xl px-4 py-4">
                <div class="flex items-start gap-2">
                  <span class="text-lg mt-0.5">🏛️</span>
                  <div>
                    <p class="text-sm font-bold text-green-800">Ambil Buku di Bagian Akademik</p>
                    <p class="text-xs text-green-700 mt-1 leading-relaxed">
                      Silakan datang ke <span class="font-semibold">Bagian Akademik</span> dan
                      tunjukkan nomor pesanan berikut:
                    </p>
                    <div
                      class="mt-3 bg-white rounded-xl px-4 py-2.5 inline-block border border-green-200"
                    >
                      <p class="text-xs text-green-500 mb-0.5">ID Pesanan</p>
                      <p class="font-mono font-bold text-green-700 tracking-widest text-lg">
                        #{{ order.id }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="proofSrc" class="mt-4">
                <p class="text-xs font-semibold text-green-700 mb-2">Bukti yang diterima:</p>
                <a :href="proofSrc" target="_blank">
                  <img
                    :src="proofSrc"
                    class="max-h-40 rounded-xl shadow-sm object-contain border border-green-200 hover:opacity-90 transition"
                  />
                </a>
              </div>
            </div>
          </div>
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
</style>
