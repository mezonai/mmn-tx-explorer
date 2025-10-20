import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect_uri = process.env.NEXT_PUBLIC_OAUTH2_REDIRECT_URI || '';
  const backendRaw = process.env.NEXT_PUBLIC_APP_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || '';
  const backend = backendRaw.replace(/\/$/, '');

  if (!code) {
    return NextResponse.redirect('/?error=missing_code');
  }

  try {
    const response = await fetch(`${backend}/1337/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri }),
    });

    if (!response.ok) {
      console.error('Failed to exchange code with backend:', response.status);
      return NextResponse.redirect('/?error=oauth_failed');
    }

    const oauthData = await response.json();
    console.log('OAuth data received from backend:', oauthData);
    // Trả về HTML có script lưu vào localStorage rồi redirect
    const html = `<!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>OAuth Callback</title></head>
      <body>
        <script>
          window.localStorage.setItem('oauth_data', ${JSON.stringify(JSON.stringify(oauthData))});
          window.location.href = '/';
        </script>
        <noscript>Vui lòng bật Javascript để tiếp tục.</noscript>
      </body>
      </html>`;
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error during OAuth callback processing:', error);
    return NextResponse.redirect('/?error=oauth_error');
  }
}
