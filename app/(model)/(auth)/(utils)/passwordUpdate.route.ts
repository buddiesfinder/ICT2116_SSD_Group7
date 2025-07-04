import { db } from '@/lib/db'; // Your DB client
import bcrypt from 'bcrypt';   // Make sure to install this: npm i bcrypt

const SALT_ROUNDS = 10; // Cost Factor for bcrypt

export async function passwordUpdate(user_id: string, newPassword: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    // Hash the new password
    const updatedhashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update the password in the Users table
    const [result]: any = await db.execute(
      `UPDATE User SET password = ? WHERE user_id = ?`,
      [updatedhashedPassword, user_id]
    );

    // Check if update affected any rows
    if (result.affectedRows === 0) {
      return {
        success: false,
        message: 'User not found or password unchanged',
      };
    }

    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error: any) {
    console.error('Password update error:', error);
    return {
      success: false,
      message: 'Failed to update password',
    };
  }
}
