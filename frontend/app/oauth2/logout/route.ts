import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const refresh_token = body.refresh_token;
    const backend = process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, '');
    let beRes = null;
    let beStatus = 500;
    if (refresh_token && backend) {
      const res = await fetch(`${backend}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
      beStatus = res.status;
      beRes = await res.json().catch(() => null);
    }
    return NextResponse.json({ status: beStatus, data: beRes }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Logout proxy error', detail: String(err) }, { status: 500 });
  }
}
