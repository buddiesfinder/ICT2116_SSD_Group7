'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface OTPInputProps {
  length?: number;
  userId?: string;
}

export default function OTPInput({ 
  length = 6,
  userId 
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [sessionUserId, setSessionUserId] = useState<string>(userId || '');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();
  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Load userId from sessionStorage 
    const storedUserId = sessionStorage.getItem('otp_user_id');
    if (storedUserId) {
      setSessionUserId(storedUserId);
      
    }
  }, []);

  const handleChange = (index: number, value: string): void => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== '') && !isVerifying) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Handle paste
    if (e.key === 'Enter') {
      const otpValue = otp.join('');
      if (otpValue.length === length) {
        handleVerify(otpValue);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length && i < length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex === -1 ? length - 1 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Auto-verify if complete
      if (newOtp.every(digit => digit !== '')) {
        handleVerify(newOtp.join(''));
      }
    }
  };

  const handleVerify = async (otpValue: string): Promise<void> => {
    if (!sessionUserId) {
      setError(
          <>
            User session not found.{' '} Please {' '}
            <span
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Re-login
            </span>
            .
          </>
        );
      return;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      // Make POST request to Next.js API route
      const response = await fetch('/api/verifyotp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionUserId, // hardcode user 1 --> bull.daniel.3@gmail.com
          otp: otpValue,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsVerified(true);
        // Update session storage with verification status (commented for Claude.ai)
        // sessionStorage.setItem('otpVerified', 'true');
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

  const handleResend = async (): Promise<void> => {
    if (!sessionUserId) {
      setError(
          <>
            User session not found.{' '} Please {' '}
            <span
              onClick={() => router.push('/login')}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Re-login
            </span>
            .
          </>
        );
      return;
    }

    setIsResending(true);
    setError('');
    setIsVerified(false);
    setOtp(new Array(length).fill(''));
    
    try {
      // Make POST request to Next.js API route
      const response = await fetch('/api/resendotp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: sessionUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to resend code. Please try again.');
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center border border-gray-700/50">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/30">
              <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Verification Successful!</h2>
            <p className="text-gray-300 mb-2">Your account has been verified successfully.</p>
            <p className="text-gray-400 text-sm mb-6">User ID: {sessionUserId}</p>
            <button
              onClick={() => {router.push('/');}}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-400 hover:to-purple-400 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-700/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Enter Verification Code</h1>
            <p className="text-gray-300">We've sent a 6-digit code to your email</p>
            {sessionUserId && (
              <p className="text-gray-500 text-xs mt-2">Session: {sessionUserId}</p>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl transition-all duration-200 bg-gray-700/50 ${
                    error 
                      ? 'border-red-400/60 bg-red-500/10 text-red-400' 
                      : digit
                        ? 'border-blue-400 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/20' 
                        : 'border-gray-600 hover:border-gray-500 focus:border-blue-400 focus:bg-blue-500/10 text-gray-200'
                  } focus:outline-none focus:ring-4 focus:ring-blue-500/20 placeholder-gray-500`}
                  disabled={isVerifying || isResending}
                />
              ))}
            </div>

            {error && (
              <div className="text-center">
                <p className="text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {isVerifying && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-blue-400">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="font-medium">Verifying...</span>
                </div>
              </div>
            )}

            <div className="text-center">
              {sessionUserId ? (<>
                <p className="text-gray-400 text-sm">
                  Didn't receive the code? {' '}
                  <button
                    onClick={handleResend}
                    disabled={isVerifying || isResending}
                    className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </button>
                </p>
              </>)
            :
            (
            <>
            <p className="text-gray-400 text-sm">
                User not detected. Please {' '}
                <button
                  onClick={() => {router.push('/login')}}
                  disabled={isVerifying || isResending}
                  className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Re-Login
                </button>
              </p>
            </>  
            ) 
              }
              
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex items-center justify-center space-x-2 text-gray-500 text-xs">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Your information is secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}