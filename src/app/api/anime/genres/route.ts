import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.sankavollerei.com/anime';

export async function GET() {
  try {
    const response = await fetch(`${BASE_URL}/genre`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch genres');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching genres:', error);
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 });
  }
}
