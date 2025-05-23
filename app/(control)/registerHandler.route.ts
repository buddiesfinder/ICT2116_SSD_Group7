import { db } from '@/lib/db'; // adjust the path as needed

export async function registerHandler(email: string, password: string): Promise<{ success: boolean; message: string }> {
  console.log('Login handler called with:', email, password);

  try {
    const [result] = await db.query(
      'INSERT INTO SSD.User (email, password, role, last_logged_in, suspended) VALUES (?, ?, ?, ?, ?)',
      [email, password, 'procurer', new Date(), false]
    );

    console.log('Insert successful:', result);

    return {
      success: true,
      message: 'Inserted test login to DB',
    };
  } catch (error: any) {
    console.error('DB Insert Error:', error);

    return {
      success: false,
      message: 'Failed to insert into DB',
    };
  }
}
