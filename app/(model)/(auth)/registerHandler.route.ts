import { db } from '@/lib/db'; // adjust the path as needed

export async function registerHandler(email: string, password: string): Promise<{ success: boolean; message: string }> {
  console.log('Register handler called with:', email, password);

  try {
    const [result] = await db.query(
      'INSERT INTO SSD.User (email, password, role, login_attempts, suspended) VALUES (?, ?, ?, ?, ?)',
      [email, password, 'procurer', 0, false]
    );

    console.log('Insert successful:', result);

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
