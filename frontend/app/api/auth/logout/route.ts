import { NextResponse } from 'next/server';

export async function GET(request: Request) {

  const baseUrl = `${process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI?.split('/api/auth/callback')[0]}`;
  const response = NextResponse.redirect(`${baseUrl}/user`);
  response.cookies.set('auth_token', '', { maxAge: 0, httpOnly: true, secure: true, sameSite: 'lax' });
  return response;
}
