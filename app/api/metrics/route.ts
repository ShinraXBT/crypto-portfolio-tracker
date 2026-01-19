import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const initialInvestment = parseFloat(searchParams.get('initialInvestment') || '0')

    // Get all monthly totals grouped by year/month
    const entries = await prisma.monthlyEntry.groupBy({
      by: ['year', 'month'],
      _sum: { valueUsd: true },
      orderBy: [{ year: 'asc' }, { month: 'asc' }]
    })

    if (entries.length === 0) {
      return NextResponse.json({
        currentValue: 0,
        athValue: 0,
        athDate: null,
        roiPercent: 0,
        drawdownPercent: 0,
        btcComparisonPercent: 0,
        variation24h: null,
        variation30d: null
      })
    }

    // Current value
    const currentValue = entries[entries.length - 1]._sum.valueUsd || 0

    // Find ATH
    let athValue = 0
    let athYear = 0
    let athMonth = 0

    for (const entry of entries) {
      const value = entry._sum.valueUsd || 0
      if (value > athValue) {
        athValue = value
        athYear = entry.year
        athMonth = entry.month
      }
    }

    // Calculate ROI
    const roiPercent = initialInvestment > 0
      ? ((currentValue - initialInvestment) / initialInvestment) * 100
      : 0

    // Calculate Drawdown
    const drawdownPercent = athValue > 0
      ? ((currentValue - athValue) / athValue) * 100
      : 0

    // 30-day variation
    let variation30d = null
    if (entries.length >= 2) {
      const prevValue = entries[entries.length - 2]._sum.valueUsd || 0
      if (prevValue > 0) {
        variation30d = ((currentValue - prevValue) / prevValue) * 100
      }
    }

    // BTC comparison (simplified - would need historical BTC prices)
    const btcComparisonPercent = 0

    return NextResponse.json({
      currentValue: Math.round(currentValue * 100) / 100,
      athValue: Math.round(athValue * 100) / 100,
      athDate: athYear && athMonth ? `${athYear}-${String(athMonth).padStart(2, '0')}-01` : null,
      roiPercent: Math.round(roiPercent * 100) / 100,
      drawdownPercent: Math.round(drawdownPercent * 100) / 100,
      btcComparisonPercent,
      variation24h: null,
      variation30d: variation30d ? Math.round(variation30d * 100) / 100 : null
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 })
  }
}
