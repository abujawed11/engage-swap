// src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import { API_BASE } from '../lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const identifier = location.state?.identifier || '';

  const [step, setStep] = useState(1); // Step 1: Verify OTP, Step 2: Set Password
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please enter the verification code');
      return;
    }

    if (code.trim().length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          code: code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Invalid verification code');
      }

      // Code is valid, move to step 2
      setStep(2);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Both password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to reset password');
      }

      // Navigate to login page with success message
      navigate('/login', {
        replace: true,
        state: {
          message: 'Password reset successfully! Please login with your new password.'
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if no identifier
  if (!identifier) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <p className="text-slate-600 mb-4">Invalid reset link</p>
          <Link to="/forgot-password" className="text-teal-600 hover:text-teal-700 font-medium">
            Request a new reset code
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        {step === 1 ? (
          // Step 1: Verify OTP
          <>
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-slate-900">Verify Code</h1>
              <p className="text-slate-600 mt-2">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  Check your email for the 6-digit code
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>

              <div className="text-center text-sm space-y-2">
                <Link to="/forgot-password" className="block text-teal-600 hover:text-teal-700 font-medium">
                  Didn't receive code? Request new one
                </Link>
                <Link to="/login" className="block text-slate-600 hover:text-slate-700">
                  ← Back to Login
                </Link>
              </div>
            </form>
          </>
        ) : (
          // Step 2: Set New Password
          <>
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-green-100 rounded-full mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900">Set New Password</h1>
              <p className="text-slate-600 mt-2">
                Code verified! Now create your new password
              </p>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </Button>

              <div className="text-center text-sm">
                <Link to="/login" className="block text-slate-600 hover:text-slate-700">
                  ← Back to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
