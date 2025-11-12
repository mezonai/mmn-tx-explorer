import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieStore = await cookies();
  const storeState = cookieStore.get('state');
  if (!code || !state || state !== storeState?.value) {
    console.error('Missing code, state, or CSRF token in storage.');
    return NextResponse.redirect(`${origin}${origin}/?error='missing_auth_code_state_or_CSRF_token_in_storage.`);
  }
  const originalState = JSON.parse(Buffer.from(state, 'base64').toString());
  const redirect_url = `${origin}${originalState.redirect_url}/?authCode=${code}`;
  return NextResponse.redirect(redirect_url);
}
