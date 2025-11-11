import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state');
  const authUrl =
    `${process.env.NEXT_PUBLIC_OAUTH2_API_URL}/oauth2/auth?` +
    `client_id=${process.env.NEXT_PUBLIC_OAUTH2_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI!)}&` +
    'response_type=code&' +
    'scope=openid+offline&' +
    `state=${state}`;

  const response = NextResponse.redirect(authUrl);
  return response;
}
