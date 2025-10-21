import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { API_BASE, auth, setToken } from '../lib/api';
import { useApp } from '../lib/appState';
import PageSEO from '../components/PageSEO';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [sendingOTP, setSendingOTP] = useState(true);
  const otpSentRef = useRef(false);

  // Auto-send OTP when component mounts (only once)
  useEffect(() => {
    // Prevent double-sending in React StrictMode
    if (otpSentRef.current) {
      return;
    }

    // Check if we already sent OTP in this session
    const otpSentTime = sessionStorage.getItem('admin_otp_sent_at');
    const now = Date.now();

    // If OTP was sent less than 60 seconds ago, skip sending
    if (otpSentTime && (now - parseInt(otpSentTime)) < 60000) {
      setSendingOTP(false);
      setMessage('OTP already sent. Please check your email or wait 60 seconds to resend.');
      otpSentRef.current = true;
      return;
    }

    otpSentRef.current = true;
    sendOTP();
  }, []);

  const sendOTP = async () => {
    try {
      setSendingOTP(true);
      setError('');

      const response = await fetch(`${API_BASE}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // No email needed - uses .env
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit error gracefully
        if (response.status === 429) {
          setError('Please wait 60 seconds before requesting another OTP');
          setSendingOTP(false);
          return;
        }
        setError(data.error?.message || 'Failed to send OTP');
        setSendingOTP(false);
        return;
      }

      // Store the timestamp when OTP was sent
      sessionStorage.setItem('admin_otp_sent_at', Date.now().toString());
      setMessage('OTP sent to your admin email. Please check your inbox.');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code) {
      setError('OTP code is required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/auth/admin-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }), // No email needed
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error?.message || 'Invalid OTP');
        return;
      }

      // Store token using the helper function
      setToken(data.token);

      // Fetch full user profile data (includes coins, etc.)
      const userData = await auth.me();
      setUser(userData);

      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // Check cooldown before resending
    const otpSentTime = sessionStorage.getItem('admin_otp_sent_at');
    const now = Date.now();

    if (otpSentTime && (now - parseInt(otpSentTime)) < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - parseInt(otpSentTime))) / 1000);
      setError(`Please wait ${remainingSeconds} seconds before requesting another OTP`);
      return;
    }

    setCode('');
    setError('');
    setMessage('');
    await sendOTP();
  };

  return (
    <>
      <PageSEO
        title="Admin | EngageSwap"
        description="Administration portal."
        canonicalPath="/admin"
        robots="noindex,nofollow,noarchive"
      />


      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Admin Login
            </h1>
            <p className="text-slate-600">
              {sendingOTP
                ? 'Sending OTP to your email...'
                : 'Enter the OTP code sent to your email'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              {message}
            </div>
          )}

          {sendingOTP ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-2xl font-mono tracking-widest"
                  disabled={loading}
                  required
                  autoFocus
                />
                <p className="mt-2 text-xs text-slate-500 text-center">
                  Check your email inbox for the OTP code
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 text-center">
              Regular user? <a href="/login" className="text-teal-600 hover:underline">Login here</a>
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
