import { db } from '@/lib/db';
import { sendRegistrationEmail } from '@/app/(model)/(auth)/(register)/sendRegistrationEmail.route';

export async function registerHandler(email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    const [result] = await db.query(
      'INSERT INTO SSD.User (email, password, role, login_attempts, suspended) VALUES (?, ?, ?, ?, ?)',
      [email, password, 'procurer', 0, false]
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
