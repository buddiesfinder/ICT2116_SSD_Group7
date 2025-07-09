import bcrypt from 'bcrypt';
import { db } from '@/lib/db';
import { sendRegistrationEmail } from '@/app/(model)/(auth)/(register)/sendRegistrationEmail.route';

const SALT_ROUNDS = 10; // Cost Factor for bcrypt

export async function registerHandler(email: string, password: string, name: string): Promise<{ success: boolean; message: string }> {
  try {

    // Hash the password with bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await db.execute(
      'INSERT INTO User (name, email, password, role, login_attempts, suspended) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, 'procurer', 0, false]
    );

    const emailResult = await sendRegistrationEmail(email);
    if (!emailResult.success) {
      console.warn('Email failed:', emailResult.message);
    }

    return {
      success: true,
      message: 'User Registered',
    };
  } catch (error: any) {
    console.error('DB Insert Error:', error);
    return {
      success: false,
      message: 'User Registration Failed.',
    };
  }
}
