import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.sankavollerei.com/anime';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || '1';
  
  try {
    const response = await fetch(`${BASE_URL}/complete-anime?page=${page}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch complete anime');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching complete anime:', error);
    return NextResponse.json({ error: 'Failed to fetch complete anime' }, { status: 500 });
  }
}
