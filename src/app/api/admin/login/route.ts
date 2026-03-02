import { NextRequest, NextResponse } from 'next/server';

// Admin credentials - hardcoded for reliability across all deployments
// You can also set environment variables to override these defaults
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'samu';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'samuel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = body?.username?.trim()?.toLowerCase();
    const password = body?.password;

    console.log('Login attempt:', { username, expectedUsername: ADMIN_USERNAME.toLowerCase() });

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username dan password diperlukan' },
        { status: 400 }
      );
    }

    // Check credentials (case-insensitive username, exact password)
    if (username === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ 
        success: true, 
        admin: { username: ADMIN_USERNAME } 
      });
      
      response.cookies.set('admin_session', ADMIN_USERNAME.toLowerCase(), {
        httpOnly: true,
        secure: false, // Set to false for both local and preview to work
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });

      console.log('Login successful for:', username);
      return response;
    }

    console.log('Login failed: wrong credentials');
    return NextResponse.json(
      { error: 'Username atau password salah!' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Admin login endpoint',
    hint: 'Login dengan username: samu, password: samuel'
  });
}
