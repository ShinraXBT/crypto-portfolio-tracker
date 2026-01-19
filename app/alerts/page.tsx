'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface Wallet {
  id: number
  name: string
}

interface Alert {
  id: number
  name: string
  alertType: string
  condition: string
  threshold: number
  walletId: number | null
  isActive: boolean
  triggeredAt: string | null
  wallet?: Wallet
}

const ALERT_TYPES = [
  { value: 'value_threshold', label: 'Portfolio Value' },
  { value: 'variation_percent', label: 'Variation %' },
  { value: 'btc_price', label: 'BTC Price' }
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    alertType: 'value_threshold',
    condition: 'above',
    threshold: '',
    walletId: '',
    isActive: true
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  async function fetchData() {
    try {
      const [alertsRes, walletsRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/wallets')
      ])
      if (alertsRes.ok) setAlerts(await alertsRes.json())
      if (walletsRes.ok) setWallets(await walletsRes.json())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAddModal = () => {
    setEditingAlert(null)
    setFormData({ name: '', alertType: 'value_threshold', condition: 'above', threshold: '', walletId: '', isActive: true })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (alert: Alert) => {
    setEditingAlert(alert)
    setFormData({
      name: alert.name,
      alertType: alert.alertType,
      condition: alert.condition,
      threshold: alert.threshold.toString(),
      walletId: alert.walletId?.toString() || '',
      isActive: alert.isActive
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError(null)

    try {
      const url = editingAlert ? `/api/alerts/${editingAlert.id}` : '/api/alerts'
      const method = editingAlert ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          alertType: formData.alertType,
          condition: formData.condition,
          threshold: parseFloat(formData.threshold),
          walletId: formData.walletId ? parseInt(formData.walletId) : null,
          isActive: formData.isActive
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save alert')
      }

      setShowModal(false)
      fetchData()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (alert: Alert) => {
    if (!confirm(`Delete alert "${alert.name}"?`)) return
    try {
      await fetch(`/api/alerts/${alert.id}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      alert('Failed to delete')
    }
  }

  const toggleActive = async (alert: Alert) => {
    try {
      await fetch(`/api/alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !alert.isActive })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to toggle:', error)
    }
  }

  const formatThreshold = (alert: Alert) => {
    if (alert.alertType === 'variation_percent') return `${alert.threshold}%`
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(alert.threshold)
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alerts</h1>
        <button onClick={openAddModal} className="btn btn-primary">
          + Create Alert
        </button>
      </div>

      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={cn('card', !alert.isActive && 'opacity-60')}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{alert.name}</h3>
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      alert.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    )}>
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {alert.triggeredAt && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Triggered
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{ALERT_TYPES.find(t => t.value === alert.alertType)?.label}</span>
                    <span>{alert.condition === 'above' ? 'Above' : 'Below'} {formatThreshold(alert)}</span>
                    <span>{alert.wallet?.name || 'Global'}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => toggleActive(alert)} className={cn(
                    'p-2 rounded-lg transition-colors',
                    alert.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                  )}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button onClick={() => openEditModal(alert)} className="p-2 text-gray-400 hover:text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(alert)} className="p-2 text-gray-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No alerts configured</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Create alerts to get notified about portfolio changes.</p>
          <button onClick={openAddModal} className="btn btn-primary mt-4">
            Create First Alert
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)}></div>
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingAlert ? 'Edit Alert' : 'Create Alert'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="label">Alert Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Alert Type</label>
                  <select
                    value={formData.alertType}
                    onChange={(e) => setFormData({ ...formData, alertType: e.target.value })}
                    className="input"
                  >
                    {ALERT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Condition</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="input"
                    >
                      <option value="above">Above</option>
                      <option value="below">Below</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Threshold *</label>
                    <input
                      type="number"
                      value={formData.threshold}
                      onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                      required
                      step="0.01"
                      className="input"
                    />
                  </div>
                </div>

                {formData.alertType === 'value_threshold' && (
                  <div>
                    <label className="label">Wallet (optional)</label>
                    <select
                      value={formData.walletId}
                      onChange={(e) => setFormData({ ...formData, walletId: e.target.value })}
                      className="input"
                    >
                      <option value="">Global (All wallets)</option>
                      {wallets.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Alert is active
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading} className="btn btn-primary">
                    {formLoading ? 'Saving...' : (editingAlert ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
