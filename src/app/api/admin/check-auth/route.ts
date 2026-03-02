import { NextRequest, NextResponse } from 'next/server';

// Admin credentials from environment variables (works on Vercel/cloud deployment)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'samu';

export async function GET(request: NextRequest) {
  try {
    const session = request.cookies.get('admin_session');

    if (!session || !session.value) {
      return NextResponse.json({ authenticated: false });
    }

    // Check if session matches admin username
    if (session.value.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
      return NextResponse.json({ 
        authenticated: true, 
        admin: { username: ADMIN_USERNAME } 
      });
    }

    return NextResponse.json({ authenticated: false });
  } catch (error) {
    console.error('Check-auth error:', error);
    return NextResponse.json({ authenticated: false });
  }
}
