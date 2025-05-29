import redis from '@/lib/redis';

export async function recaptchaVerification(
  token: string
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const secretKey = process.env.RECAPTCHA_VERIFY;

    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const response = await fetch(verifyURL, {
        method: "POST",
    });

    const data = await response.json();

    if (!data.success || data.score < 0.5) {
        return { 
            success: false, 
            message: "Failed verification"
        };
    }

    return {
        success: data.success,
        message: "Recaptcha Verification Passed"
    }

  } catch (error) {
    return {
      success: false,
      message: `Failed to verify recaptcha`,
    };
  }
}
