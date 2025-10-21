import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const refresh_token = body.refresh_token;
    console.log(refresh_token);
    const backend = process.env.NEXT_PUBLIC_APP_API_URL?.replace(/\/$/, '');
    let beRes = null;
    let beStatus = 500;
    if (refresh_token && backend) {
      const res = await fetch(`${backend}/1337/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
      beStatus = res.status;
      beRes = await res.json().catch(() => null);
    }
    console.log('Logout response:', beStatus, beRes);
    return NextResponse.json({ status: beStatus, data: beRes }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Logout proxy error', detail: String(err) }, { status: 500 });
  }
}
