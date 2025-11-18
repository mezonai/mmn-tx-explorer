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

  const originalState = JSON.parse(Buffer.from(state, 'base64').toString());
  const redirect_url = `${pathName}${originalState.redirect_url}/?authCode=${code}`;
  return NextResponse.redirect(redirect_url);
}
