import bcrypt from 'bcryptjs';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: number;
  score: number;
}

// Common passwords list (top 100 most common)
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', '12345678',
  'password1', '1234567', 'welcome', '1234567890', 'admin', 'root',
  'letmein', 'monkey', '1234', 'dragon', 'master', 'sunshine', 'princess',
  'football', 'qwerty123', 'starwars', '123123', 'shadow', 'superman',
];

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function validatePassword(
  password: string
): Promise<PasswordValidationResult> {
  const errors: string[] = [];
  let strength = 0;
  let score = 0;

  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length >= 8) {
    score += 1;
    if (password.length >= 12) {
      score += 1;
      strength += 1;
    }
    if (password.length >= 16) {
      score += 1;
      strength += 1;
    }
  }

  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters');
  } else {
    score += 1;
    strength += 1;
  }

  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters');
  } else {
    score += 1;
    strength += 1;
  }

  // Number check
  if (!/\d/.test(password)) {
    errors.push('Password must contain numbers');
  } else {
    score += 1;
    strength += 1;
  }

  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/;'`~]/.test(password)) {
    errors.push('Password must contain special characters');
  } else {
    score += 1;
    strength += 1;
  }

  // Check for repeating characters
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password contains too many repeating characters');
    score -= 1;
  }

  // Check for sequential characters
  if (
    /012|123|234|345|456|567|678|789|890/.test(password) ||
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(
      password
    )
  ) {
    errors.push('Password contains sequential characters');
    score -= 1;
  }

  // Common password check
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password');
    score = 0;
  }

  // Calculate final strength (0-5)
  strength = Math.max(0, Math.min(5, strength));

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, Math.min(100, score * 12.5)), // Convert to 0-100 scale
  };
}

export async function checkBreachedPassword(
  password: string
): Promise<boolean> {
  // Check against HaveIBeenPwned API
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`
    );

    if (!response.ok) {
      // If API fails, don't block the user
      console.error('Failed to check password breach');
      return false;
    }

    const text = await response.text();
    const hashes = text.split('\n');

    for (const hash of hashes) {
      const [hashSuffix] = hash.split(':');
      if (hashSuffix === suffix) {
        return true; // Password has been breached
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking password breach:', error);
    return false; // Don't block user if API fails
  }
}

export function getPasswordStrengthLabel(strength: number): string {
  switch (strength) {
    case 0:
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    case 5:
      return 'Very Strong';
    default:
      return 'Unknown';
  }
}

export function getPasswordStrengthColor(strength: number): string {
  switch (strength) {
    case 0:
    case 1:
      return 'text-red-500';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-yellow-500';
    case 4:
      return 'text-green-500';
    case 5:
      return 'text-emerald-500';
    default:
      return 'text-gray-500';
  }
}
