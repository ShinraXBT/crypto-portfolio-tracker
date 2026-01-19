<script setup>
import { ref, computed } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'

const props = defineProps({
  wallets: Array,
  year: Number,
  month: Number,
  type: {
    type: String,
    default: 'monthly' // 'monthly' or 'daily'
  }
})

const emit = defineEmits(['close', 'added'])
const store = usePortfolioStore()

const selectedMonth = ref(props.month || new Date().getMonth() + 1)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const btcPrice = ref('')
const entries = ref(
  props.wallets.map(w => ({
    wallet_id: w.id,
    wallet_name: w.name,
    value_usd: ''
  }))
)
const loading = ref(false)
const error = ref(null)

const months = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
]

const totalValue = computed(() => {
  return entries.value.reduce((sum, e) => {
    const val = parseFloat(e.value_usd) || 0
    return sum + val
  }, 0)
})

async function handleSubmit() {
  loading.value = true
  error.value = null

  try {
    const validEntries = entries.value.filter(e => e.value_usd && parseFloat(e.value_usd) > 0)

    if (validEntries.length === 0) {
      error.value = 'Please enter at least one wallet value'
      loading.value = false
      return
    }

    if (props.type === 'monthly') {
      await store.addBulkMonthlyEntries({
        year: props.year,
        month: selectedMonth.value,
        btc_price: btcPrice.value ? parseFloat(btcPrice.value) : null,
        entries: validEntries.map(e => ({
          wallet_id: e.wallet_id,
          value_usd: parseFloat(e.value_usd)
        }))
      })
    } else {
      // Daily entries - add one by one
      for (const entry of validEntries) {
        await store.addDailyEntry({
          wallet_id: entry.wallet_id,
          date: selectedDate.value,
          value_usd: parseFloat(entry.value_usd)
        })
      }
    }

    emit('added')
  } catch (e) {
    error.value = e.response?.data?.detail || 'Failed to add entry'
  } finally {
    loading.value = false
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}
</script>

<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black/50" @click="emit('close')"></div>

    <!-- Modal -->
    <div class="relative min-h-screen flex items-center justify-center p-4">
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Add {{ type === 'monthly' ? 'Monthly' : 'Daily' }} Entry
          </h2>
          <button @click="emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-700 dark:text-red-300 text-sm">
            {{ error }}
          </div>

          <!-- Date/Month Selector -->
          <div v-if="type === 'monthly'" class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Year</label>
              <input type="text" :value="year" disabled class="input bg-gray-100 dark:bg-gray-600" />
            </div>
            <div>
              <label class="label">Month</label>
              <select v-model="selectedMonth" class="input">
                <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
              </select>
            </div>
          </div>

          <div v-else>
            <label class="label">Date</label>
            <input type="date" v-model="selectedDate" class="input" />
          </div>

          <!-- BTC Price (monthly only) -->
          <div v-if="type === 'monthly'">
            <label class="label">BTC Price (optional)</label>
            <input
              type="number"
              v-model="btcPrice"
              step="0.01"
              placeholder="e.g., 94500.00"
              class="input"
            />
          </div>

          <!-- Wallet Values -->
          <div>
            <label class="label">Wallet Values</label>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="entry in entries"
                :key="entry.wallet_id"
                class="flex items-center space-x-2"
              >
                <span class="w-32 text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ entry.wallet_name }}
                </span>
                <div class="flex-1 relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    v-model="entry.value_usd"
                    step="0.01"
                    placeholder="0.00"
                    class="input pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <span class="font-medium text-gray-700 dark:text-gray-300">Total</span>
              <span class="text-xl font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(totalValue) }}
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4">
            <button type="button" @click="emit('close')" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="loading" class="btn btn-primary">
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
              <span v-else>Save Entry</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
