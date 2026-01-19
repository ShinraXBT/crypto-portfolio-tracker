'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatPercent, cn, MONTH_NAMES } from '@/lib/utils'
import AddEntryModal from '@/components/AddEntryModal'

interface Wallet {
  id: number
  name: string
}

interface DailySnapshot {
  date: string
  totalValue: number
  deltaPercent: number
  wallets: Record<string, number>
}

export default function DailyPage() {
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const [walletsRes, snapshotsRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch(`/api/daily/snapshots?year=${selectedYear}&month=${selectedMonth}`)
      ])

      if (walletsRes.ok) setWallets(await walletsRes.json())
      if (snapshotsRes.ok) setSnapshots(await snapshotsRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedYear, selectedMonth])

  const handleEntryAdded = () => {
    setShowModal(false)
    fetchData()
  }

  const formatDay = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    return `${day}${day === 1 ? 'er' : 'e'} ${MONTH_NAMES[selectedMonth].substring(0, 3)}`
  }

  const getVariationClass = (value: number) => {
    if (value > 0) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
    if (value < 0) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Tracking</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          + Add Entry
        </button>
      </div>

      {/* Month/Year Selector */}
      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <button onClick={() => setSelectedYear(y => y - 1)} className="btn btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xl font-bold text-gray-800 dark:text-white px-4">{selectedYear}</span>
            <button onClick={() => setSelectedYear(y => y + 1)} className="btn btn-secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {MONTH_NAMES.slice(1).map((month, index) => (
              <button
                key={index + 1}
                onClick={() => setSelectedMonth(index + 1)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                  selectedMonth === index + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {month.substring(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Cards Grid */}
      {snapshots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {snapshots.map((snapshot) => (
            <div key={snapshot.date} className="card p-0 overflow-hidden">
              <div className="bg-header text-white px-4 py-2 font-semibold">
                {formatDay(snapshot.date)}
              </div>
              <div className="p-4 space-y-2">
                {Object.entries(snapshot.wallets).map(([name, value]) => (
                  <div key={name} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
                    <span className="font-mono text-sm">{formatCurrency(value)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Total</span>
                  <span className="font-bold font-mono">{formatCurrency(snapshot.totalValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Variation %</span>
                  <span className={cn('px-2 py-0.5 rounded text-sm font-medium', getVariationClass(snapshot.deltaPercent))}>
                    {formatPercent(snapshot.deltaPercent)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No daily data for {MONTH_NAMES[selectedMonth]} {selectedYear}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Start tracking your daily portfolio values.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">
            Add First Entry
          </button>
        </div>
      )}

      {showModal && (
        <AddEntryModal
          wallets={wallets}
          year={selectedYear}
          month={selectedMonth}
          type="daily"
          onClose={() => setShowModal(false)}
          onAdded={handleEntryAdded}
        />
      )}
    </div>
  )
}
