import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const years = await prisma.monthlyEntry.groupBy({
      by: ['year'],
      orderBy: { year: 'desc' }
    })

    return NextResponse.json(years.map(y => y.year))
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch years' }, { status: 500 })
  }
}
