'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { passwordStrengthCheckerAsync } from '@/utils/passwordStrengthChecker';

// Types
interface PasswordValidation {
  valid: boolean;
  message: string;
}

interface FormState {
  newPassword: string;
  confirmPassword: string;
  resetToken: string;
  isLoading: boolean;
  error: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

// Components
const EyeIcon = ({ isVisible }: { isVisible: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {isVisible ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
      />
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    )}
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ProgressIndicator = () => (
  <div className="flex items-center justify-center mb-6">
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
        <CheckIcon />
      </div>
      <div className="w-8 h-0.5 bg-green-600" />
      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center">
        <CheckIcon />
      </div>
      <div className="w-8 h-0.5 bg-blue-600" />
      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
        3
      </div>
    </div>
  </div>
);

const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleVisibility,
  validationMessage
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleVisibility: () => void;
  validationMessage?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm mb-1">
      {label}
    </label>
    <div className="relative">
      <input
        type={showPassword ? "text" : "password"}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 pr-10 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
      >
        <EyeIcon isVisible={showPassword} />
      </button>
    </div>
    {validationMessage && (
      <div className={`text-xs mt-1 ${validationMessage.includes('✓') ? 'text-green-400' : 'text-red-400'}`}>
        {validationMessage}
      </div>
    )}
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-red-400 text-sm text-center bg-red-900/20 border border-red-800 rounded p-2">
    {message}
  </div>
);

// Main Component
export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({
    newPassword: '',
    confirmPassword: '',
    resetToken: '',
    isLoading: false,
    error: '',
    showPassword: false,
    showConfirmPassword: false,
  });

  // Initialize reset token
  useEffect(() => {
    const storedToken = sessionStorage.getItem('reset_token');
    if (!storedToken) {
      // Uncomment to redirect if no token
      // router.push('/forgot-password');
      return;
    }
    setState(prev => ({ ...prev, resetToken: storedToken }));
  }, [router]);

  // Computed values
  const passwordsMatch = state.newPassword === state.confirmPassword && state.confirmPassword.length > 0;
  const confirmPasswordMessage = state.confirmPassword.length > 0 
    ? (passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match')
    : undefined;

  // Handlers
  const updateState = (updates: Partial<FormState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const clearSessionStorage = () => {
    sessionStorage.removeItem('reset_email');
    sessionStorage.removeItem('reset_token');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateState({ error: '' });

    try {
      // Validate password strength
      const passwordValidation: PasswordValidation = await passwordStrengthCheckerAsync(state.newPassword);
      if (!passwordValidation.valid) {
        updateState({ error: passwordValidation.message });
        return;
      }

      // Check password match
      if (state.newPassword !== state.confirmPassword) {
        updateState({ error: 'Passwords do not match.' });
        return;
      }

      updateState({ isLoading: true });

      // Submit password reset
      const response = await fetch('/api/forgot-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resetToken: state.resetToken, 
          newPassword: state.newPassword 
        }),
      });

      const data = await response.json();

      if (data.success) {
        clearSessionStorage();
        router.push('/login?message=password-reset-success');
      } else {
        updateState({ error: data.message || 'Failed to reset password. Please try again.' });
      }
    } catch (error) {
      updateState({ error: 'Network Error. Please try again.' });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const isSubmitDisabled = state.isLoading || !passwordsMatch;

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Create New Password</h2>
          <p className="text-zinc-400 text-sm">Enter your new password below</p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            id="newPassword"
            label="New Password"
            value={state.newPassword}
            onChange={(value) => updateState({ newPassword: value })}
            showPassword={state.showPassword}
            onToggleVisibility={() => updateState({ showPassword: !state.showPassword })}
          />

          <PasswordInput
            id="confirmPassword"
            label="Confirm New Password"
            value={state.confirmPassword}
            onChange={(value) => updateState({ confirmPassword: value })}
            showPassword={state.showConfirmPassword}
            onToggleVisibility={() => updateState({ showConfirmPassword: !state.showConfirmPassword })}
            validationMessage={confirmPasswordMessage}
          />

          {state.error && <ErrorMessage message={state.error} />}

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full py-2 mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
          >
            {state.isLoading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}