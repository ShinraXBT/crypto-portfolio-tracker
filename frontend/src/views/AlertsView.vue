<script setup>
import { onMounted, computed, ref } from 'vue'
import { useAlertsStore } from '../stores/alerts'
import { usePortfolioStore } from '../stores/portfolio'

const alertsStore = useAlertsStore()
const portfolioStore = usePortfolioStore()

const alerts = computed(() => alertsStore.alerts)
const wallets = computed(() => portfolioStore.wallets)
const loading = computed(() => alertsStore.loading)

const showModal = ref(false)
const editingAlert = ref(null)
const formData = ref({
  name: '',
  alert_type: 'value_threshold',
  condition: 'above',
  threshold: '',
  wallet_id: null,
  is_active: true
})
const formError = ref(null)
const formLoading = ref(false)

const alertTypes = [
  { value: 'value_threshold', label: 'Portfolio Value', description: 'Alert when total value reaches a threshold' },
  { value: 'variation_percent', label: 'Variation %', description: 'Alert when daily variation exceeds threshold' },
  { value: 'btc_price', label: 'BTC Price', description: 'Alert when BTC reaches a price level' }
]

const conditions = [
  { value: 'above', label: 'Above' },
  { value: 'below', label: 'Below' }
]

onMounted(async () => {
  await Promise.all([
    alertsStore.fetchAlerts(),
    portfolioStore.fetchWallets()
  ])
})

function openAddModal() {
  editingAlert.value = null
  formData.value = {
    name: '',
    alert_type: 'value_threshold',
    condition: 'above',
    threshold: '',
    wallet_id: null,
    is_active: true
  }
  formError.value = null
  showModal.value = true
}

function openEditModal(alert) {
  editingAlert.value = alert
  formData.value = {
    name: alert.name,
    alert_type: alert.alert_type,
    condition: alert.condition,
    threshold: alert.threshold,
    wallet_id: alert.wallet_id,
    is_active: alert.is_active
  }
  formError.value = null
  showModal.value = true
}

async function handleSubmit() {
  formLoading.value = true
  formError.value = null

  try {
    const data = {
      ...formData.value,
      threshold: parseFloat(formData.value.threshold),
      wallet_id: formData.value.wallet_id || null
    }

    if (editingAlert.value) {
      await alertsStore.updateAlert(editingAlert.value.id, data)
    } else {
      await alertsStore.createAlert(data)
    }
    showModal.value = false
  } catch (e) {
    formError.value = e.response?.data?.detail || 'An error occurred'
  } finally {
    formLoading.value = false
  }
}

async function handleDelete(alert) {
  if (!confirm(`Delete alert "${alert.name}"?`)) return
  try {
    await alertsStore.deleteAlert(alert.id)
  } catch (e) {
    // Error handling done in store
  }
}

async function handleReset(alert) {
  try {
    await alertsStore.resetAlert(alert.id)
  } catch (e) {
    // Error handling done in store
  }
}

async function toggleActive(alert) {
  try {
    await alertsStore.updateAlert(alert.id, { is_active: !alert.is_active })
  } catch (e) {
    // Error handling done in store
  }
}

function getAlertTypeLabel(type) {
  return alertTypes.find(t => t.value === type)?.label || type
}

function formatThreshold(alert) {
  if (alert.alert_type === 'variation_percent') {
    return `${alert.threshold}%`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(alert.threshold)
}

function getWalletName(walletId) {
  if (!walletId) return 'Global'
  const wallet = wallets.value.find(w => w.id === walletId)
  return wallet?.name || 'Unknown'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Alerts</h1>
      <button @click="openAddModal" class="btn btn-primary">
        + Create Alert
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Alerts List -->
    <div v-else-if="alerts.length" class="space-y-4">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        :class="[
          'card',
          !alert.is_active && 'opacity-60'
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-3">
              <h3 class="font-semibold text-gray-900 dark:text-white">{{ alert.name }}</h3>
              <span :class="[
                'px-2 py-0.5 text-xs font-medium rounded-full',
                alert.is_active
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              ]">
                {{ alert.is_active ? 'Active' : 'Inactive' }}
              </span>
              <span v-if="alert.triggered_at" class="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                Triggered
              </span>
            </div>

            <div class="mt-2 flex flex-wrap gap-4 text-sm">
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {{ getAlertTypeLabel(alert.alert_type) }}
              </div>
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                {{ alert.condition === 'above' ? 'Above' : 'Below' }} {{ formatThreshold(alert) }}
              </div>
              <div class="flex items-center text-gray-600 dark:text-gray-400">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {{ getWalletName(alert.wallet_id) }}
              </div>
            </div>

            <p v-if="alert.triggered_at" class="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              Last triggered: {{ new Date(alert.triggered_at).toLocaleString() }}
            </p>
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="toggleActive(alert)"
              :class="[
                'p-2 rounded-lg transition-colors',
                alert.is_active
                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
              :title="alert.is_active ? 'Disable' : 'Enable'"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="alert.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path v-if="alert.is_active" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
            <button
              v-if="alert.triggered_at"
              @click="handleReset(alert)"
              class="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
              title="Reset alert"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              @click="openEditModal(alert)"
              class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="handleDelete(alert)"
              class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No alerts configured</h3>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Create alerts to get notified about portfolio changes.</p>
      <button @click="openAddModal" class="btn btn-primary mt-4">
        Create First Alert
      </button>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="fixed inset-0 bg-black/50" @click="showModal = false"></div>
      <div class="relative min-h-screen flex items-center justify-center p-4">
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ editingAlert ? 'Edit Alert' : 'Create Alert' }}
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
              <label class="label">Alert Name *</label>
              <input
                type="text"
                v-model="formData.name"
                required
                placeholder="e.g., Portfolio ATH Alert"
                class="input"
              />
            </div>

            <div>
              <label class="label">Alert Type</label>
              <select v-model="formData.alert_type" class="input">
                <option v-for="type in alertTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
              <p class="mt-1 text-xs text-gray-500">
                {{ alertTypes.find(t => t.value === formData.alert_type)?.description }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Condition</label>
                <select v-model="formData.condition" class="input">
                  <option v-for="cond in conditions" :key="cond.value" :value="cond.value">
                    {{ cond.label }}
                  </option>
                </select>
              </div>
              <div>
                <label class="label">Threshold *</label>
                <input
                  type="number"
                  v-model="formData.threshold"
                  required
                  step="0.01"
                  :placeholder="formData.alert_type === 'variation_percent' ? 'e.g., -10' : 'e.g., 500000'"
                  class="input"
                />
              </div>
            </div>

            <div v-if="formData.alert_type === 'value_threshold'">
              <label class="label">Wallet (optional)</label>
              <select v-model="formData.wallet_id" class="input">
                <option :value="null">Global (All wallets)</option>
                <option v-for="wallet in wallets" :key="wallet.id" :value="wallet.id">
                  {{ wallet.name }}
                </option>
              </select>
            </div>

            <div class="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                v-model="formData.is_active"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label for="is_active" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Alert is active
              </label>
            </div>

            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" @click="showModal = false" class="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" :disabled="formLoading" class="btn btn-primary">
                {{ formLoading ? 'Saving...' : (editingAlert ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
