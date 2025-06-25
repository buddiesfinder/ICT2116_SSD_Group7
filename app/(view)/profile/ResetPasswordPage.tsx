'use client';

import { useState } from 'react';
import { passwordStrengthCheckerAsync } from '@/utils/passwordStrengthChecker';
import SuccessPage from '../success_payment/page';

// Types
interface PasswordValidation {
  valid: boolean;
  message: string;
}

export default function ResetPasswordPage(
{
  token,
}: {
  token: string | null;
}
)
{
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  
  const handlePasswordReset = async () => {

    const passwordValidation: PasswordValidation = await passwordStrengthCheckerAsync(newPassword);
    if (!passwordValidation.valid) {
      setMessage({ text: passwordValidation.message, success: false });

    return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({text: 'Passwords do not match.', success: false});
      return;
    }

   try {
    const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        setMessage({text: errorData.message || 'Failed to reset password.', success: false});
        return;
    }

    setMessage( {text: 'Password updated successfully!', success: true } );
    setNewPassword('');
    setConfirmPassword('');
    } catch (error) {
    setMessage({text: 'An unexpected error occurred.', success: false });
    console.error(error);
    }


    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
    <div className="max-w-md rounded-xl shadow-md">

      <button
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowResetPassword(!showResetPassword)}
      >
        {showResetPassword ? '^ Reset Password' : '> Reset Password'}
      </button>

      {showResetPassword && (
        <div className="mt-4">
          <label className="block mb-2">
            New Password:
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>

          <label className="block mb-2">
            Confirm Password:
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>

          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-2"
            onClick={handlePasswordReset}
          >
            Submit
          </button>

          {message && (
            <p
              className={`mt-2 text-sm ${
                message.success ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      )}
    </div>

    </>
  );
}
