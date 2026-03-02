import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Track visitor
export async function POST(request: NextRequest) {
  try {
    // Get IP address from headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIP || 'unknown';

    const userAgent = request.headers.get('user-agent') || undefined;
    
    const body = await request.json().catch(() => ({}));
    const path = body.path || undefined;

    // Only track if IP is not unknown
    if (ipAddress !== 'unknown') {
      await db.visitor.create({
        data: {
          ipAddress,
          userAgent,
          path,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
