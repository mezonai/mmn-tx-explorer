import { NextResponse } from 'next/server';

export async function GET() {
  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = `${process.env.NEXT_PUBLIC_OAUTH2_API_URL}/oauth2/auth?` +
    `client_id=${process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI!)}&` +
    'response_type=code&' +
    'scope=openid&' +
    `state=${state}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
