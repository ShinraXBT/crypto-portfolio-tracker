import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const entries = await prisma.dailyEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { wallet: true },
      orderBy: { date: 'asc' }
    })

    return NextResponse.json(entries)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletId, date, valueUsd, notes } = body

    const entry = await prisma.dailyEntry.create({
      data: {
        walletId,
        date: new Date(date),
        valueUsd,
        notes
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Entry already exists for this wallet/date' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 })
  }
}
