import { db } from '@/lib/db';  // Your DB client (e.g. mysql2/promise)

export async function sessionQuery(user_id: number): Promise<{
  success: boolean;
  message: string;
  session_token?: string;
}> {
   try {
    // Query to find the existing session token for the user
    const [rows]: any = await db.query(
      `SELECT session_token FROM Session_Token WHERE user_id = ?`,
      [user_id]
    );

    if (rows.length > 0) {
      return {
        success: true,
        message: 'Session token retrieved successfully',
        session_token: rows[0].session_token,
      };
    } else {
      return {
        success: false,
        message: 'No session token found for this user',
      };
    }
  } catch (error: any) {
    console.error('DB query error:', error);
    return {
      success: false,
      message: 'Failed to retrieve session token',
    };
  }
}
