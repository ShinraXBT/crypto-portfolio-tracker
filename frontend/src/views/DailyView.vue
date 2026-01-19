<script setup>
import { onMounted, computed, ref } from 'vue'
import { usePortfolioStore } from '../stores/portfolio'
import AddEntryModal from '../components/AddEntryModal.vue'

const store = usePortfolioStore()

const showAddModal = ref(false)
const dailySnapshots = computed(() => store.dailySnapshots)
const selectedYear = computed(() => store.selectedYear)
const selectedMonth = computed(() => store.selectedMonth)
const loading = computed(() => store.loading)
const wallets = computed(() => store.wallets)

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

const currentMonthLabel = computed(() => {
  return months.find(m => m.value === selectedMonth.value)?.label || ''
})

onMounted(async () => {
  await store.fetchWallets()
  await store.fetchDailySnapshots()
})

function selectMonth(month) {
  store.setSelectedMonth(month)
  store.fetchDailySnapshots(selectedYear.value, month)
}

function changeYear(delta) {
  const newYear = selectedYear.value + delta
  store.setSelectedYear(newYear)
  store.fetchDailySnapshots(newYear, selectedMonth.value)
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

function formatDay(dateStr) {
  const date = new Date(dateStr)
  const day = date.getDate()
  const suffix = getDaySuffix(day)
  return `${day}${suffix} ${currentMonthLabel.value.substring(0, 3)}`
}

function getDaySuffix(day) {
  if (day > 3 && day < 21) return 'e'
  switch (day % 10) {
    case 1: return 'er'
    default: return 'e'
  }
}

function getVariationClass(value) {
  if (value > 0) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  if (value < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

function handleEntryAdded() {
  showAddModal.value = false
  store.fetchDailySnapshots()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Daily Tracking</h1>
      <button @click="showAddModal = true" class="btn btn-primary">
        + Add Entry
      </button>
    </div>

    <!-- Month/Year Selector -->
    <div class="card">
      <div class="flex items-center justify-between">
        <!-- Year Navigation -->
        <div class="flex items-center space-x-2">
          <button @click="changeYear(-1)" class="btn btn-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-xl font-bold text-gray-800 dark:text-white px-4">{{ selectedYear }}</span>
          <button @click="changeYear(1)" class="btn btn-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <!-- Month Selector -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="month in months"
            :key="month.value"
            @click="selectMonth(month.value)"
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              selectedMonth === month.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            {{ month.label.substring(0, 3) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <!-- Daily Cards Grid -->
    <div v-else-if="dailySnapshots.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="snapshot in dailySnapshots"
        :key="snapshot.date"
        class="card p-0 overflow-hidden"
      >
        <!-- Card Header -->
        <div class="bg-header text-white px-4 py-2 font-semibold">
          {{ formatDay(snapshot.date) }}
        </div>

        <!-- Wallet Values -->
        <div class="p-4 space-y-2">
          <div
            v-for="(value, name) in snapshot.wallets"
            :key="name"
            class="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-0"
          >
            <span class="text-sm text-gray-600 dark:text-gray-400">{{ name }}</span>
            <span class="font-mono text-sm">{{ formatCurrency(value) }}</span>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 space-y-1">
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700 dark:text-gray-300">Total</span>
            <span class="font-bold font-mono">{{ formatCurrency(snapshot.total_value) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-500 dark:text-gray-400">Variation %</span>
            <span :class="['px-2 py-0.5 rounded text-sm font-medium', getVariationClass(snapshot.delta_percent)]">
              {{ formatPercent(snapshot.delta_percent) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="card text-center py-12">
      <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No daily data for {{ currentMonthLabel }} {{ selectedYear }}</h3>
      <p class="mt-2 text-gray-500 dark:text-gray-400">Start tracking your daily portfolio values.</p>
      <button @click="showAddModal = true" class="btn btn-primary mt-4">
        Add First Entry
      </button>
    </div>

    <!-- Add Entry Modal -->
    <AddEntryModal
      v-if="showAddModal"
      :wallets="wallets"
      :year="selectedYear"
      :month="selectedMonth"
      type="daily"
      @close="showAddModal = false"
      @added="handleEntryAdded"
    />
  </div>
</template>
