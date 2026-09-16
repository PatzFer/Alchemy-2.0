import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';

export interface WebAuthnCapability {
  supported: boolean;
  hasPlatformAuthenticator: boolean;
  isInIframe: boolean;
  isPolicyBlocked: boolean;
}

export function isWebAuthnAllowedInCurrentContext(): boolean {
  if (typeof window === 'undefined') return false;
  if (!browserSupportsWebAuthn()) return false;

  // In an iframe, check permissions policy
  if (window.self !== window.top) {
    const doc = document as any;
    if (doc.permissionsPolicy && typeof doc.permissionsPolicy.allowsFeature === 'function') {
      try {
        return doc.permissionsPolicy.allowsFeature('publickey-credentials-get');
      } catch {
        return false;
      }
    }
    if (doc.featurePolicy && typeof doc.featurePolicy.allowsFeature === 'function') {
      try {
        return doc.featurePolicy.allowsFeature('publickey-credentials-get');
      } catch {
        return false;
      }
    }
    // In cross-origin sandbox iframes without explicit allow attribute, it is blocked
    return false;
  }

  return true;
}

export async function checkWebAuthnCapability(): Promise<WebAuthnCapability> {
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;
  const isAllowed = isWebAuthnAllowedInCurrentContext();
  const supported = browserSupportsWebAuthn() && isAllowed;
  let hasPlatformAuthenticator = false;

  if (supported) {
    try {
      hasPlatformAuthenticator = await platformAuthenticatorIsAvailable();
    } catch {
      hasPlatformAuthenticator = false;
    }
  }

  return {
    supported,
    hasPlatformAuthenticator,
    isInIframe,
    isPolicyBlocked: isInIframe && !isAllowed,
  };
}

export async function registerNewPasskey(nickname: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  isIframeBlocked?: boolean;
}> {
  if (!isWebAuthnAllowedInCurrentContext()) {
    return {
      success: false,
      isIframeBlocked: true,
      error:
        'Hardware platform biometrics (Touch ID / Face ID / Windows Hello) require opening the app in a new browser tab due to iframe security policies. Open P & M Alchemy in a new tab to enroll passkeys, or use TOTP Authenticator below.',
    };
  }

  try {
    // 1. Get options from server
    const optRes = await fetch('/api/auth/webauthn/register-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || 'Failed to initialize passkey options');
    }

    const options = await optRes.json();

    // 2. Call browser WebAuthn API
    const attResp = await startRegistration({ optionsJSON: options });

    // 3. Verify with server
    const verifyRes = await fetch('/api/auth/webauthn/register-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: attResp, nickname }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.verified) {
      throw new Error(verifyData.error || 'Passkey verification failed on server');
    }

    return {
      success: true,
      message: verifyData.message || 'Passkey registered successfully.',
    };
  } catch (error: any) {
    const msg = error.message || String(error);
    const isIframeBlocked =
      error.name === 'NotAllowedError' ||
      msg.includes('not allowed') ||
      msg.includes('permissions policy') ||
      msg.includes('Feature policy') ||
      msg.includes('publickey-credentials');

    if (isIframeBlocked) {
      console.info('Passkey registration restricted in this frame context.');
    } else {
      console.warn('Passkey registration notice:', msg);
    }

    return {
      success: false,
      error: isIframeBlocked
        ? 'Browser sandbox policy in iframe restricted platform biometrics. Open P & M Alchemy in a new tab to use Touch ID / Face ID / Windows Hello, or use your TOTP Authenticator app.'
        : msg,
      isIframeBlocked,
    };
  }
}

export async function authenticateWithPasskey(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  isIframeBlocked?: boolean;
}> {
  if (!isWebAuthnAllowedInCurrentContext()) {
    return {
      success: false,
      isIframeBlocked: true,
      error:
        'Platform biometric authenticator requires direct top-level window context. Please open in a new tab or use your 6-digit TOTP Authenticator code / Recovery Code.',
    };
  }

  try {
    // 1. Get auth options from server
    const optRes = await fetch('/api/auth/webauthn/auth-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!optRes.ok) {
      const err = await optRes.json();
      throw new Error(err.error || 'Failed to initialize passkey authentication options');
    }

    const options = await optRes.json();

    // 2. Call browser WebAuthn API
    const asseResp = await startAuthentication({ optionsJSON: options });

    // 3. Verify with server
    const verifyRes = await fetch('/api/auth/webauthn/auth-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: asseResp }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || !verifyData.verified) {
      throw new Error(verifyData.error || 'Passkey authentication failed');
    }

    return {
      success: true,
      message: verifyData.message || 'Biometric authentication verified.',
    };
  } catch (error: any) {
    const msg = error.message || String(error);
    const isIframeBlocked =
      error.name === 'NotAllowedError' ||
      msg.includes('not allowed') ||
      msg.includes('permissions policy') ||
      msg.includes('Feature policy') ||
      msg.includes('publickey-credentials');

    if (isIframeBlocked) {
      console.info('Passkey authentication restricted in this frame context.');
    } else {
      console.warn('Passkey authentication notice:', msg);
    }

    return {
      success: false,
      error: isIframeBlocked
        ? 'Platform biometric authenticator requires direct top-level window context. Please open in a new tab or use your 6-digit TOTP Authenticator code / Recovery Code.'
        : msg,
      isIframeBlocked,
    };
  }
}
