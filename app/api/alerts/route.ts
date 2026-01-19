import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const alerts = await prisma.alert.findMany({
      where: activeOnly ? { isActive: true } : {},
      include: { wallet: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(alerts)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, alertType, condition, threshold, walletId, isActive } = body

    const alert = await prisma.alert.create({
      data: {
        name,
        alertType,
        condition,
        threshold,
        walletId: walletId || null,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
