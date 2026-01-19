<script setup>
import { onMounted, computed, ref } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'

const store = usePortfolioStore()

const wallets = computed(() => store.wallets)
const loading = computed(() => store.loading)

const showModal = ref(false)
const editingWallet = ref(null)
const formData = ref({
  name: '',
  description: '',
  color: '#3b82f6'
})
const formError = ref(null)
const formLoading = ref(false)

const predefinedColors = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
]

onMounted(() => {
  store.fetchWallets()
})

function openAddModal() {
  editingWallet.value = null
  formData.value = { name: '', description: '', color: '#3b82f6' }
  formError.value = null
  showModal.value = true
}

function openEditModal(wallet) {
  editingWallet.value = wallet
  formData.value = {
    name: wallet.name,
    description: wallet.description || '',
    color: wallet.color
  }
  formError.value = null
  showModal.value = true
}

async function handleSubmit() {
  formLoading.value = true
  formError.value = null

  try {
    if (editingWallet.value) {
      await store.updateWallet(editingWallet.value.id, formData.value)
    } else {
      await store.createWallet(formData.value)
    }
    showModal.value = false
  } catch (e) {
    formError.value = e.response?.data?.detail || 'An error occurred'
  } finally {
    formLoading.value = false
  }
}

async function handleDelete(wallet) {
  if (!confirm(`Are you sure you want to delete "${wallet.name}"? This will also delete all associated entries.`)) {
    return
  }

  try {
    await store.deleteWallet(wallet.id)
  } catch (e) {
    alert('Failed to delete wallet')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Wallets</h1>
      <button @click="openAddModal" class="btn btn-primary">
        + Add Wallet
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Wallets Grid -->
    <div v-else-if="wallets.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="wallet in wallets"
        :key="wallet.id"
        class="card"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              :style="{ backgroundColor: wallet.color }"
            >
              {{ wallet.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ wallet.name }}</h3>
              <p v-if="wallet.description" class="text-sm text-gray-500 dark:text-gray-400">
                {{ wallet.description }}
              </p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button
              @click="openEditModal(wallet)"
              class="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="handleDelete(wallet)"
              class="p-2 text-gray-400 hover:text-red-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p class="text-xs text-gray-400">
            Created: {{ new Date(wallet.created_at).toLocaleDateString() }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No wallets yet</h3>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Create your first wallet to start tracking.</p>
      <button @click="openAddModal" class="btn btn-primary mt-4">
        Create First Wallet
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-black/50" @click="showModal = false"></div>
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ editingWallet ? 'Edit Wallet' : 'Add Wallet' }}
            </h2>
            <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
            <div v-if="formError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
              {{ formError }}
            </div>

            <div>
              <label class="label">Name *</label>
              <input
                type="text"
                v-model="formData.name"
                required
                placeholder="e.g., Solana, Rabby, Degen"
                class="input"
              />
            </div>

            <div>
              <label class="label">Description</label>
              <textarea
                v-model="formData.description"
                rows="2"
                placeholder="Optional description"
                class="input"
              ></textarea>
            </div>

            <div>
              <label class="label">Color</label>
              <div class="flex items-center space-x-2">
                <div class="flex space-x-2">
                  <button
                    v-for="color in predefinedColors"
                    :key="color"
                    type="button"
                    @click="formData.color = color"
                    :class="[
                      'w-8 h-8 rounded-lg transition-transform',
                      formData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                    ]"
                    :style="{ backgroundColor: color }"
                  ></button>
                </div>
                <input
                  type="color"
                  v-model="formData.color"
                  class="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" @click="showModal = false" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" :disabled="formLoading" class="btn btn-primary">
                {{ formLoading ? 'Saving...' : (editingWallet ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
