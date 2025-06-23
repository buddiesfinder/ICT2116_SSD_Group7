'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOtpPage() {
  const length = 6;
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [sessionUserId, setSessionUserId] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const RESEND_INTERVAL = 100;

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();

    const storedUserId = sessionStorage.getItem('otp_user_id');
    if (storedUserId) setSessionUserId(storedUserId);

    const storedTimestamp = sessionStorage.getItem('otp_resend_timestamp');
    if (storedTimestamp) {
      const elapsed = Math.floor((Date.now() - Number(storedTimestamp)) / 1000);
      if (elapsed < RESEND_INTERVAL) setResendCooldown(RESEND_INTERVAL - elapsed);
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');
    if (value && index < length - 1) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((digit) => digit !== '') && !isVerifying) handleVerify(newOtp.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < length - 1) inputRefs.current[index + 1]?.focus();
    if (e.key === 'Enter') {
      const otpValue = otp.join('');
      if (otpValue.length === length) handleVerify(otpValue);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length && i < length; i++) newOtp[i] = pasted[i];
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((d) => d === '');
      const focusIndex = nextEmpty === -1 ? length - 1 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();
      if (newOtp.every((d) => d !== '')) handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = async (otpValue: string) => {
    if (!sessionUserId) {
      setError(<>User session not found. <span onClick={() => router.push('/login')} className="text-blue-400 hover:underline cursor-pointer">Re-login</span>.</>);
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/verifyotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sessionUserId, otp: otpValue }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setIsVerified(true);
        router.refresh();
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
        setOtp(new Array(length).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Verification failed. Please check your connection and try again.');
      console.error('OTP verification error:', err);
      setOtp(new Array(length).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!sessionUserId) {
      setError(<>User session not found. <span onClick={() => router.push('/login')} className="text-blue-400 hover:underline cursor-pointer">Re-login</span>.</>);
      return;
    }

    const now = Date.now();
    sessionStorage.setItem('otp_resend_timestamp', now.toString());

    setIsResending(true);
    setError('');
    setIsVerified(false);
    setOtp(new Array(length).fill(''));

    try {
      const response = await fetch('/api/resendotp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sessionUserId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to resend code. Please try again.');
      } else {
        setResendCooldown(RESEND_INTERVAL);
      }
    } catch (err) {
      setError('Failed to resend code. Please check your connection and try again.');
      console.error('Resend error:', err);
    } finally {
      setIsResending(false);
      inputRefs.current[0]?.focus();
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-green-100 rounded-xl">
          <h2 className="text-2xl font-bold mb-4">✅ Verification Successful!</h2>
          <p>Your account has been verified successfully.</p>
          <p className="text-gray-600 text-sm mt-2">User ID: {sessionUserId}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-6">
        <h1 className="text-xl font-semibold mb-4">Enter Verification Code</h1>
        <p className="text-gray-500 mb-4">We've sent a 6-digit code to your email.</p>

        <div className="flex justify-center gap-2 mb-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-10 text-center text-lg border border-gray-300 rounded"
              disabled={isVerifying || isResending}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

        {isVerifying && <p className="text-center text-blue-500 text-sm">Verifying...</p>}

        <p className="text-sm text-center text-gray-600 mt-4">
          Didn't receive the code?{' '}
          <button
            onClick={handleResend}
            disabled={isVerifying || isResending || resendCooldown > 0}
            className="text-blue-500 hover:underline disabled:opacity-50"
          >
            {isResending
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend Code'}
          </button>
        </p>
      </div>
    </div>
  );
}
