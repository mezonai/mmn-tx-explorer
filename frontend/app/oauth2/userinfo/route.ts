import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userRes = await fetch(`${process.env.NEXT_PUBLIC_OAUTH2_API_URL}/userinfo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ access_token: token }),
  });
  if (!userRes.ok) return NextResponse.json({ error: 'Auth failed' }, { status: 401 });

  const userData = await userRes.json();
  return NextResponse.json(userData);
}
