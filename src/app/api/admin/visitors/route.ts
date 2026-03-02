import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all visitors with stats
export async function GET() {
  try {
    const visitors = await db.visitor.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Get unique IPs
    const uniqueIPs = await db.visitor.groupBy({
      by: ['ipAddress'],
      _count: true,
    });

    // Get visitors per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentVisitors = await db.visitor.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Group by day
    const visitorsByDay: Record<string, number> = {};
    recentVisitors.forEach((v) => {
      const day = v.createdAt.toISOString().split('T')[0];
      visitorsByDay[day] = (visitorsByDay[day] || 0) + 1;
    });

    // Get total count
    const totalVisitors = await db.visitor.count();

    return NextResponse.json({
      visitors,
      uniqueIPs: uniqueIPs.length,
      totalVisitors,
      visitorsByDay,
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete all visitors
export async function DELETE() {
  try {
    await db.visitor.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting visitors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
