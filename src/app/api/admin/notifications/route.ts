import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all notifications (admin)
export async function GET() {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ notifications: [] });
  }
}

// Create notification (admin)
export async function POST(request: NextRequest) {
  try {
    const { message, expiresAt } = await request.json();

    if (!message || !expiresAt) {
      return NextResponse.json({ error: 'Message and expiry time required' }, { status: 400 });
    }

    const notification = await db.notification.create({
      data: {
        message,
        expiresAt: new Date(expiresAt),
        isActive: true,
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete notification (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.notification.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
