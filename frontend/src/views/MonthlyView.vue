<script setup>
import { onMounted, computed, ref } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'
import AddEntryModal from '../components/AddEntryModal.vue'

const store = usePortfolioStore()

const showAddModal = ref(false)
const monthlyData = computed(() => store.monthlyData)
const availableYears = computed(() => store.availableYears)
const selectedYear = computed(() => store.selectedYear)
const loading = computed(() => store.loading)
const wallets = computed(() => store.wallets)

onMounted(async () => {
  await store.fetchWallets()
  await store.fetchAvailableYears()
  await store.fetchMonthlySummary()
})

function selectYear(year) {
  store.setSelectedYear(year)
  store.fetchMonthlySummary(year)
}

function formatCurrency(value) {
  if (value === null || value === undefined) return 'N/D'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

function formatPercent(value) {
  if (value === null || value === undefined) return 'N/D'
  return value.toFixed(2) + '%'
}

function getDeltaClass(value) {
  if (value === null || value === undefined) return ''
  if (value > 0) return 'cell-gain'
  if (value < 0) return 'cell-loss'
  return 'cell-neutral'
}

function handleEntryAdded() {
  showAddModal.value = false
  store.fetchMonthlySummary()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Monthly Tracking</h1>
      <div class="flex items-center space-x-4">
        <!-- Year Selector -->
        <div class="flex items-center space-x-2">
          <button
            v-for="year in availableYears"
            :key="year"
            @click="selectYear(year)"
            :class="[
              'px-4 py-2 rounded-lg font-medium transition-colors',
              selectedYear === year
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
            ]"
          >
            {{ year }}
          </button>
        </div>
        <button @click="showAddModal = true" class="btn btn-primary">
          + Add Entry
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Monthly Table -->
    <div v-else-if="monthlyData" class="card overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header">
              <th class="px-4 py-3 text-left">Months</th>
              <th class="px-4 py-3 text-right">Wallets</th>
              <th class="px-4 py-3 text-right">Delta $</th>
              <th class="px-4 py-3 text-right">Delta %</th>
              <th class="px-4 py-3 text-right">BTC Price</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="month in monthlyData.monthly_data"
              :key="month.month"
              class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                {{ month.month_name }}
              </td>
              <td class="px-4 py-3 text-right font-mono">
                {{ formatCurrency(month.total_value) }}
              </td>
              <td :class="['px-4 py-3 text-right font-mono', getDeltaClass(month.delta_usd)]">
                {{ formatCurrency(month.delta_usd) }}
              </td>
              <td :class="['px-4 py-3 text-right font-mono', getDeltaClass(month.delta_percent)]">
                {{ formatPercent(month.delta_percent) }}
              </td>
              <td class="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                {{ formatCurrency(month.btc_price) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bg-blue-50 dark:bg-blue-900/30 font-bold">
              <td class="px-4 py-3 text-gray-900 dark:text-white">Delta {{ selectedYear }}</td>
              <td class="px-4 py-3 text-right font-mono">
                {{ formatCurrency(monthlyData.end_value - monthlyData.start_value) }}
              </td>
              <td :class="['px-4 py-3 text-right font-mono', getDeltaClass(monthlyData.delta_usd)]">
                {{ formatCurrency(monthlyData.delta_usd) }}
              </td>
              <td :class="['px-4 py-3 text-right font-mono', getDeltaClass(monthlyData.delta_percent)]">
                {{ formatPercent(monthlyData.delta_percent) }}
              </td>
              <td class="px-4 py-3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No monthly data</h3>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Start by adding your first monthly entry.</p>
      <button @click="showAddModal = true" class="btn btn-primary mt-4">
        Add First Entry
      </button>
    </div>

    <!-- Wallet Details Section -->
    <div v-if="monthlyData?.monthly_data?.length" class="card">
      <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Wallet Breakdown</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(value, name) in monthlyData.monthly_data[monthlyData.monthly_data.length - 1]?.wallets"
          :key="name"
          class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
        >
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ name }}</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(value) }}</p>
        </div>
      </div>
    </div>

    <!-- Add Entry Modal -->
    <AddEntryModal
      v-if="showAddModal"
      :wallets="wallets"
      :year="selectedYear"
      type="monthly"
      @close="showAddModal = false"
      @added="handleEntryAdded"
    />
  </div>
</template>
