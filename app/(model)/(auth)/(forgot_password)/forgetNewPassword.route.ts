import { db } from '@/lib/db'; // adjust the path as needed
import { verifyForgotPasswordToken } from '../(token)/(forgot_password)/verifyForgotPasswordToken.route';
import { passwordUpdate } from '../(utils)/passwordUpdate.route';
import { sendEmailHandler } from '../../(email)/sendEmail.route';
import { send } from 'process';

export async function forgetNewPassword (
    forgot_password_token: string,
    new_password: string,

): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const verifyForgetPasswordToken = await verifyForgotPasswordToken(forgot_password_token);

    if (!verifyForgetPasswordToken.success) {
        return {
            success: verifyForgetPasswordToken.success,
            message: verifyForgetPasswordToken.message
        }
    }

    // DB password update here
    const updateDB = await passwordUpdate(verifyForgetPasswordToken.payload.userId, new_password);
    
    if (!updateDB.success) {
      return {
        success: updateDB.success,
        message: updateDB.message
      }
    }

    // get user email
    const [rows]: any = await db.query(
      `SELECT email FROM SSD.User WHERE user_id = ?`,
      [verifyForgetPasswordToken.payload.userId]
    );

    const userEmail = rows?.[0]?.email;
    
    const sendNotification = await sendEmailHandler(
      userEmail,
      `Notification of Change of Password`,
      `Dear User,\n\nYour password has been updated. If you did not perform this action, please contact us immediately at 6554 1121.\n\nRegards,\nSupport Team`
    );

    if (!sendNotification.success) {
      return {
        success: sendNotification.success,
        message: sendNotification.message
      }
    }

    return {
        success: sendNotification.success,
        message: sendNotification.message
    }


    

  } catch (error: any) {
    return {
      success: false,
      message: `ForgetNewPassword Failed: ${error}`,
    };
  }
}
