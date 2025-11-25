import { NextRequest, NextResponse } from 'next/server';

const cobarURL = process.env.NEXT_PUBLIC_COBAR_API_URL || '';
const cobarAPIKey = process.env.NEXT_PUBLIC_COBAR_API_KEY || '';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: pathArray } = await params;
    const path = pathArray.join('/');
    const url = `${cobarURL}/${path}`;

    const response = await fetch(url, {
      headers: {
        'x-dashboard-api-key': cobarAPIKey,
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
