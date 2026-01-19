<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps({
  data: {
    type: Object,
    required: true
  },
  horizontal: {
    type: Boolean,
    default: false
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: props.horizontal ? 'y' : 'x',
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          let label = context.dataset.label || ''
          if (label) {
            label += ': '
          }
          if (context.parsed.y !== null || context.parsed.x !== null) {
            const value = props.horizontal ? context.parsed.x : context.parsed.y
            label += new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(value)
          }
          return label
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: !props.horizontal
      },
      ticks: props.horizontal ? {
        callback: function(value) {
          return '$' + value.toLocaleString()
        }
      } : {}
    },
    y: {
      grid: {
        display: props.horizontal
      },
      ticks: !props.horizontal ? {
        callback: function(value) {
          return '$' + value.toLocaleString()
        }
      } : {}
    }
  }
}))
</script>

<template>
  <Bar :data="data" :options="chartOptions" />
</template>
