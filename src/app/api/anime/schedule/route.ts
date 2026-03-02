import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.sankavollerei.com/anime';

export async function GET() {
  try {
    const response = await fetch(`${BASE_URL}/schedule`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch schedule');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}
