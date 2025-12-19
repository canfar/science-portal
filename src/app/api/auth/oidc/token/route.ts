/**
 * OIDC Token Exchange API Route
 *
 * Exchanges an OIDC authorization code for access and refresh tokens.
 * This route is called by the client-side OIDC callback page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOIDCConfig } from '@/lib/config/auth-config';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri, codeVerifier } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    if (!codeVerifier) {
      return NextResponse.json(
        { error: 'PKCE code verifier is required' },
        { status: 400 }
      );
    }

    const oidcConfig = getOIDCConfig();

    // Discover OIDC endpoints
    const discoveryUrl = `${oidcConfig.issuer}.well-known/openid-configuration`;
    const discoveryResponse = await fetch(discoveryUrl);

    if (!discoveryResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to discover OIDC endpoints' },
        { status: 500 }
      );
    }

    const discoveryDoc = await discoveryResponse.json();
    const tokenUrl = discoveryDoc.token_endpoint;

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri || oidcConfig.redirectUrl,
      client_id: oidcConfig.clientId,
      client_secret: oidcConfig.clientSecret,
      code_verifier: codeVerifier,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.json(
        { error: 'Token exchange failed', details: errorText },
        { status: response.status }
      );
    }

    const tokens = await response.json();

    // Fetch user info using the access token
    let userInfo = null;
    try {
      const userInfoUrl = discoveryDoc.userinfo_endpoint;
      const userInfoResponse = await fetch(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        userInfo = await userInfoResponse.json();
      }
    } catch (error) {
      console.warn('Failed to fetch user info:', error);
    }

    // Return tokens and user info to the client
    return NextResponse.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      token_type: tokens.token_type,
      user: userInfo,
    });
  } catch (error) {
    console.error('Error in token exchange:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
