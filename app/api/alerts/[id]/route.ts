import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, alertType, condition, threshold, isActive } = body

    const alert = await prisma.alert.update({
      where: { id: parseInt(params.id) },
      data: {
        ...(name && { name }),
        ...(alertType && { alertType }),
        ...(condition && { condition }),
        ...(threshold !== undefined && { threshold }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(alert)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.alert.delete({
      where: { id: parseInt(params.id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
