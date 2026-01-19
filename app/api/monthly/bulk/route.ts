import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { year, month, btcPrice, entries } = body

    const created = []

    for (const entry of entries) {
      const { walletId, valueUsd } = entry

      if (walletId === undefined || valueUsd === undefined) continue

      const existing = await prisma.monthlyEntry.findUnique({
        where: {
          walletId_year_month: { walletId, year, month }
        }
      })

      if (existing) {
        const updated = await prisma.monthlyEntry.update({
          where: { id: existing.id },
          data: {
            valueUsd,
            ...(btcPrice && { btcPrice })
          }
        })
        created.push(updated)
      } else {
        const newEntry = await prisma.monthlyEntry.create({
          data: {
            walletId,
            year,
            month,
            valueUsd,
            btcPrice
          }
        })
        created.push(newEntry)
      }
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to create entries' }, { status: 500 })
  }
}
