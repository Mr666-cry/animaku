import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Get all news (public - visible to all users)
export async function GET() {
  try {
    const news = await db.news.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ news });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json({ news: [] });
  }
}
