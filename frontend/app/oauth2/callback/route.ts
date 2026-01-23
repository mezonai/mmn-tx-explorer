import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieStore = await cookies();
  const storeState = cookieStore.get('state');

  const pathName = process.env.NEXT_BASE_FE;

  if (!state) {
    console.error('Missing state');
    return NextResponse.redirect(`${pathName}/?error='missing_state`);
  }
  if (state !== storeState?.value) {
    console.error('Missing CSRF token in storage.');
    return NextResponse.redirect(`${pathName}/?error='missing_CSRF_token_in_storage.`);
  }
  if (!code) {
    console.error('Missing code');
    return NextResponse.redirect(`${pathName}/?error='missing_code`);
  }

  try {
    const originalState = JSON.parse(Buffer.from(state, 'base64').toString());
    const targetUrl = new URL(originalState.redirect_url, pathName);
    targetUrl.searchParams.set('authCode', code);
    return NextResponse.redirect(targetUrl.toString());
  } catch (error) {
    console.error('Error parsing state:', error);
    return NextResponse.redirect(`${pathName}/?error=invalid_state_format`);
  }
}
