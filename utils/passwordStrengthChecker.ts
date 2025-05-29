import { sha1 } from 'js-sha1'; 

const commonPasswords = new Set([
  '123456', 'password', '123456789', '12345678', 'qwerty', 'abc123',
  'password1', '111111', '123123', 'admin', 'letmein'
]);

export function passwordStrengthCheckerSync(password: string): { valid: boolean; message: string } {
  if (!password) return { valid: false, message: 'Password is required.' };

  if (commonPasswords.has(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common. Choose a more secure password.' };
  }

  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!strongRegex.test(password)) {
    return {
      valid: false,
      message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'
    };
  }

  return { valid: true, message: 'Password is strong.' };
}

export async function passwordStrengthCheckerAsync(password: string): Promise<{ valid: boolean; message: string }> {
  const basicCheck = passwordStrengthCheckerSync(password);
  if (!basicCheck.valid) return basicCheck;

  const isPwned = await checkPasswordPwned(password);
  if (isPwned) {
    return {
      valid: false,
      message: 'Password has been found in data breaches. Choose another one.'
    };
  }

  return { valid: true, message: 'Password is strong and safe to use.' };
}

async function checkPasswordPwned(password: string): Promise<boolean> {
  const hash = sha1(password).toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;

    const text = await res.text();
    return text.split('\n').some(line => line.startsWith(suffix));
  } catch (error) {
    console.warn('HIBP API error:', error);
    return false;
  }
}
