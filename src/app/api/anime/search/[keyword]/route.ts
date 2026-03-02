import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.sankavollerei.com/anime';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ keyword: string }> }
) {
  const { keyword } = await params;
  
  try {
    const response = await fetch(`${BASE_URL}/search/${encodeURIComponent(keyword)}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 1800 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to search anime');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching anime:', error);
    return NextResponse.json({ error: 'Failed to search anime' }, { status: 500 });
  }
}
