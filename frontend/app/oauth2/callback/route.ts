import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieStore = await cookies();
  const storedState = cookieStore.get('oauth_state')?.value;

  if (!code || !state || state !== storedState) {
    const baseUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    const response = NextResponse.redirect(`${baseUrl}/user?error=invalid_state`);
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  }

  try {
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_OAUTH2_API_URL}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID!,
        client_secret: process.env.OAUTH2_CLIENT_SECRET!,
        redirect_uri: process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI!,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('No access token');

    const baseUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    const response = NextResponse.redirect(`${baseUrl}/`);
    response.cookies.set('auth_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch {
    const baseUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    const response = NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  }
}
