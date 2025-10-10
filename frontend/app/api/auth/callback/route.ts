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
  console.log(code);
  console.log(state);
  console.log(storedState);
  console.log(process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI);
  const body = Object.entries({
    grant_type: 'authorization_code',
    code,
    client_id: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID!,
    client_secret: process.env.OAUTH2_CLIENT_SECRET!,
    redirect_uri: process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI!,
  })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  try {
    console.log('========================================');
    console.log(body);
    console.log('======================================');
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_OAUTH2_API_URL}/oauth2/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    });
    console.log(tokenRes);
    console.log('======================================');
    const tokenData = await tokenRes.json();
    console.log('json', tokenData);
    console.log('======================================');
    if (!tokenData.access_token) throw new Error('No access token');

    const baseUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    const response = NextResponse.redirect(`${baseUrl}/user`);
    response.cookies.set('auth_token', tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    console.log('======================================');
    console.log(baseUrl);
    console.log('======================================');
    console.log(response);
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  } catch (e) {
    const baseUrl = `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}`;
    console.log(baseUrl);
    const response = NextResponse.redirect(`${baseUrl}/user?error=auth_failed`);
    response.cookies.set('oauth_state', '', { maxAge: 0, path: '/' });
    return response;
  }
}
