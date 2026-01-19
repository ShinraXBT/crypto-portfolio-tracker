'use client'

import { useEffect, useState } from 'react'
import { formatCurrency, formatPercent, getDeltaClass, cn } from '@/lib/utils'
import AddEntryModal from '@/components/AddEntryModal'

interface Wallet {
  id: number
  name: string
  color: string
}

interface MonthlyData {
  month: number
  monthName: string
  totalValue: number
  deltaUsd: number
  deltaPercent: number
  btcPrice: number | null
  wallets: Record<string, number>
}

interface MonthlySummary {
  year: number
  startValue: number
  endValue: number
  deltaUsd: number
  deltaPercent: number
  monthlyData: MonthlyData[]
}

// Generate all years from 2020 to current
const currentYear = new Date().getFullYear()
const ALL_YEARS = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i)

export default function MonthlyPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlySummary | null>(null)
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const [walletsRes, monthlyRes] = await Promise.all([
        fetch('/api/wallets'),
        fetch(`/api/monthly/summary?year=${selectedYear}`)
      ])

      if (walletsRes.ok) setWallets(await walletsRes.json())
      if (monthlyRes.ok) setMonthlyData(await monthlyRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedYear])

  const handleEntryAdded = () => {
    setShowModal(false)
    fetchData()
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
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Monthly Tracking</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedYear(y => Math.max(2020, y - 1))}
              disabled={selectedYear <= 2020}
              className="btn btn-secondary disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="input w-28 text-center font-bold"
            >
              {ALL_YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => setSelectedYear(y => Math.min(currentYear, y + 1))}
              disabled={selectedYear >= currentYear}
              className="btn btn-secondary disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            + Add Entry
          </button>
        </div>
      </div>

      {/* Monthly Table */}
      {monthlyData && monthlyData.monthlyData.length > 0 ? (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-header text-white">
                  <th className="px-4 py-3 text-left font-semibold">Months</th>
                  <th className="px-4 py-3 text-right font-semibold">Wallets</th>
                  <th className="px-4 py-3 text-right font-semibold">Delta $</th>
                  <th className="px-4 py-3 text-right font-semibold">Delta %</th>
                  <th className="px-4 py-3 text-right font-semibold">BTC Price</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.monthlyData.map((month) => (
                  <tr
                    key={month.month}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {month.monthName}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(month.totalValue)}
                    </td>
                    <td className={cn('px-4 py-3 text-right font-mono', getDeltaClass(month.deltaUsd))}>
                      {formatCurrency(month.deltaUsd)}
                    </td>
                    <td className={cn('px-4 py-3 text-right font-mono', getDeltaClass(month.deltaPercent))}>
                      {formatPercent(month.deltaPercent)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                      {formatCurrency(month.btcPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 dark:bg-blue-900/30 font-bold">
                  <td className="px-4 py-3 text-gray-900 dark:text-white">Delta {selectedYear}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(monthlyData.endValue - monthlyData.startValue)}
                  </td>
                  <td className={cn('px-4 py-3 text-right font-mono', getDeltaClass(monthlyData.deltaUsd))}>
                    {formatCurrency(monthlyData.deltaUsd)}
                  </td>
                  <td className={cn('px-4 py-3 text-right font-mono', getDeltaClass(monthlyData.deltaPercent))}>
                    {formatPercent(monthlyData.deltaPercent)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No data for {selectedYear}</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Add monthly entries for this year.</p>
          <button onClick={() => setShowModal(true)} className="btn btn-primary mt-4">
            Add Entry for {selectedYear}
          </button>
        </div>
      )}

      {/* Wallet Details */}
      {monthlyData && monthlyData.monthlyData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Wallet Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(monthlyData.monthlyData[monthlyData.monthlyData.length - 1]?.wallets || {}).map(([name, value]) => (
              <div key={name} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{name}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <AddEntryModal
          wallets={wallets}
          year={selectedYear}
          type="monthly"
          onClose={() => setShowModal(false)}
          onAdded={handleEntryAdded}
        />
      )}
    </div>
  )
}
