import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const state = searchParams.get('state');
  if (!state) {
    console.error('Missing state,');
    return NextResponse.redirect(`${origin}/?error=missing_state`);
  }
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI!,
    response_type: 'code',
    scope: process.env.NEXT_PUBLIC_OAUTH2_SCOPE!,
    state,
  });
  const authUrl = `${process.env.NEXT_PUBLIC_OAUTH2_API_URL}/oauth2/auth?${params.toString()}`;
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('state', state, {
    httpOnly: true,
    maxAge: 60 * 5,
    path: '/',
    sameSite: 'lax',
  });
  return response;
}
