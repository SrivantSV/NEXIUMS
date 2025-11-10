import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { nanoid } from 'nanoid';

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export async function generateTwoFactorSecret(
  email: string,
  issuer: string = 'Nexus AI'
): Promise<TwoFactorSetup> {
  // Generate a random secret
  const secret = new OTPAuth.Secret({ size: 20 });

  // Create TOTP instance
  const totp = new OTPAuth.TOTP({
    issuer,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  // Generate QR code URL
  const uri = totp.toString();
  const qrCodeUrl = await QRCode.toDataURL(uri);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  return {
    secret: secret.base32,
    qrCodeUrl,
    backupCodes,
  };
}

export function verifyTwoFactorToken(
  token: string,
  secret: string
): boolean {
  try {
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(secret),
      digits: 6,
      period: 30,
    });

    // Verify token with a window of ±1 period (30 seconds)
    const delta = totp.validate({
      token,
      window: 1,
    });

    return delta !== null;
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = nanoid(8).toUpperCase();
    codes.push(code);
  }

  return codes;
}

export async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<boolean> {
  const hashedInput = await hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
}

export interface TwoFactorVerificationResult {
  success: boolean;
  usedBackupCode: boolean;
  remainingBackupCodes?: number;
}

export async function verifyTwoFactor(
  token: string,
  secret: string,
  backupCodes: string[]
): Promise<TwoFactorVerificationResult> {
  // First try TOTP verification
  if (verifyTwoFactorToken(token, secret)) {
    return {
      success: true,
      usedBackupCode: false,
    };
  }

  // If TOTP fails, try backup codes
  const isBackupCode = await verifyBackupCode(token, backupCodes);
  if (isBackupCode) {
    return {
      success: true,
      usedBackupCode: true,
      remainingBackupCodes: backupCodes.length - 1,
    };
  }

  return {
    success: false,
    usedBackupCode: false,
  };
}
