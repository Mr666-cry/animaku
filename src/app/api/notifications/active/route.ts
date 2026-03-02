import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get active notifications (public - visible to all users)
export async function GET() {
  try {
    const now = new Date();
    
    // Get active notifications that haven't expired
    const notifications = await db.notification.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching active notifications:', error);
    return NextResponse.json({ notifications: [] });
  }
}
