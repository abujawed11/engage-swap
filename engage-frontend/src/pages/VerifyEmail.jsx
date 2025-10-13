import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { auth } from "../lib/api";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // Get identifier and email from navigation state
  const identifier = location.state?.identifier;
  const email = location.state?.email;

  const [code, setCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if no identifier provided
  useEffect(() => {
    if (!identifier) {
      navigate("/signup");
    }
  }, [identifier, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!code || code.length !== 6) {
      setServerError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      await auth.verifyEmail(identifier, code);

      // Navigate to login page instead of auto-login
      navigate("/login", {
        state: {
          message: "Email verified successfully! Please log in with your credentials.",
        },
      });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setServerError("");
    setResendLoading(true);

    try {
      await auth.resendOTP(identifier);
      setResendCooldown(60); // 60 second cooldown
      setServerError(""); // Clear any previous errors
    } catch (err) {
      setServerError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  const maskEmail = (email) => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (local.length <= 2) return email;
    return `${local[0]}${"*".repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-semibold">Verify Your Email</h2>
        <p className="mt-2 text-slate-600">
          We've sent a 6-digit verification code to{" "}
          <span className="font-medium">{maskEmail(email)}</span>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              name="code"
              value={code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(value);
                if (serverError) setServerError("");
              }}
              placeholder="123456"
              maxLength={6}
              className={`text-center text-2xl tracking-widest ${
                serverError ? "border-red-500" : ""
              }`}
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-slate-500">
              Enter the 6-digit code from your email
            </p>
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify Email"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-slate-600">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || resendCooldown > 0}
              className={`text-teal-700 hover:underline ${
                resendLoading || resendCooldown > 0
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {resendLoading
                ? "Sending..."
                : resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </p>
        </div>

        <p className="mt-4 text-sm text-center text-slate-600">
          Wrong email?{" "}
          <Link to="/signup" className="text-teal-700 hover:underline">
            Sign up again
          </Link>
        </p>
      </Card>
    </div>
  );
}
