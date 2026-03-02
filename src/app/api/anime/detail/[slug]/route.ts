import { NextResponse } from 'next/server';

const BASE_URL = 'https://www.sankavollerei.com/anime';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    const response = await fetch(`${BASE_URL}/anime/${slug}`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch anime detail');
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching anime detail:', error);
    return NextResponse.json({ error: 'Failed to fetch anime detail' }, { status: 500 });
  }
}
