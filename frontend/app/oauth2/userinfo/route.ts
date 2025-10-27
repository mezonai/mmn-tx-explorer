import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect_uri = process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI;
  const backend = process.env.NEXT_PUBLIC_BACKEND_API_URL;

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`);
  }

  try {
    const response = await fetch(`${backend}/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri }),
    });

    if (!response.ok) {
      console.error('Failed to exchange code with backend:', response.status);
      return NextResponse.redirect(`${origin}/?error=oauth_failed`);
    }

    const oauthData = await response.json();
    return NextResponse.json(oauthData);
  } catch (error) {
    console.error('Error during OAuth callback processing:', error);
    return NextResponse.redirect(`${origin}/?error=oauth_error`);
  }
}
