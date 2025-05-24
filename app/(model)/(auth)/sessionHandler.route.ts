import { db } from '@/lib/db';  // Your DB client (e.g. mysql2/promise)
import { v4 as uuidv4 } from 'uuid';

export async function sessionHandler(user_id: number): Promise<{
  success: boolean;
  message: string;
  session_token?: string;
}> {
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const tokenId = uuidv4();

    try {
      // Try to insert the new session token
      await db.query(
        `
        INSERT INTO Session_Token (Token_id, user_id) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE Token_id = VALUES(Token_id)
        `,
        [tokenId, user_id]
      );

      // Success! Return token UUID
      return {
        success: true,
        message: 'Session created successfully',
        session_token: tokenId,
      };
    } catch (error: any) {
      // Check for duplicate key error (MySQL error code: ER_DUP_ENTRY = 'ER_DUP_ENTRY')
      // Adjust error.code depending on your DB driver
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        // UUID collision, retry with new UUID
        continue;
      }

      // Other errors: log and return failure
      console.error('DB insertion error:', error);
      return {
        success: false,
        message: 'Failed to create session token',
      };
    }
  }

  // If we exhausted retries
  return {
    success: false,
    message: 'Could not generate a unique session token after multiple attempts',
  };
}
