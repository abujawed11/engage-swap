import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { auth, setToken } from "../lib/api";
import { useApp } from "../lib/appState";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useApp();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Get success message from navigation state
  const successMessage = location.state?.message;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailNotVerified(false);

    // Basic validation
    if (!form.identifier.trim()) {
      setError("Username or email is required");
      return;
    }
    if (!form.password) {
      setError("Password is required");
      return;
    }

    setLoading(true);

    try {
      // Login and get token
      const { token } = await auth.login(form.identifier.trim(), form.password);
      setToken(token);

      // Fetch user profile
      const userData = await auth.me();
      setUser(userData);

      // Navigate to home
      navigate("/");
    } catch (err) {
      // Check if email not verified
      if (err.code === "EMAIL_NOT_VERIFIED") {
        setEmailNotVerified(true);
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setResendLoading(true);

    try {
      await auth.resendOTP(form.identifier.trim());
      // Navigate to verify-email page
      navigate("/verify-email", {
        state: {
          identifier: form.identifier.trim(),
          email: null, // We don't have the email in login form
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-semibold">Login</h2>
        <p className="mt-2 text-slate-600">
          Sign in to your account to continue.
        </p>

        {successMessage && (
          <div className="mt-4 text-sm text-green-600 bg-green-50 border border-green-200 rounded px-3 py-2">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="identifier">Username or Email</Label>
            <Input
              id="identifier"
              name="identifier"
              value={form.identifier}
              onChange={onChange}
              placeholder="johndoe or you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
              {emailNotVerified && (
                <Button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  variant="outline"
                  className="w-full"
                >
                  {resendLoading ? "Sending code..." : "Resend verification code"}
                </Button>
              )}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center text-slate-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-teal-700 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
