import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Label from "../components/ui/Label";
import { auth, setToken } from "../lib/api";
import { useApp } from "../lib/appState";
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from "../lib/validation";

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useApp();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));

    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};

    const usernameError = validateUsername(form.username);
    if (usernameError) errors.username = usernameError;

    const emailError = validateEmail(form.email);
    if (emailError) errors.email = emailError;

    const passwordError = validatePassword(form.password);
    if (passwordError) errors.password = passwordError;

    const confirmError = validateConfirmPassword(form.password, form.confirmPassword);
    if (confirmError) errors.confirmPassword = confirmError;

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    // Validate all fields
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      // Signup and get token
      const { token } = await auth.signup(
        form.username.trim(),
        form.email.trim(),
        form.password
      );
      setToken(token);

      // Fetch user profile
      const userData = await auth.me();
      setUser(userData);

      // Navigate to home
      navigate("/");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    const errors = validateForm();
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <h2 className="text-2xl font-semibold">Sign Up</h2>
        <p className="mt-2 text-slate-600">
          Create a new account to get started.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              value={form.username}
              onChange={onChange}
              placeholder="johndoe"
              className={fieldErrors.username ? "border-red-500" : ""}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              placeholder="you@example.com"
              className={fieldErrors.email ? "border-red-500" : ""}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
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
              className={fieldErrors.password ? "border-red-500" : ""}
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                At least 8 characters with 1 uppercase, 1 lowercase, and 1 number
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onChange}
              placeholder="••••••••"
              className={fieldErrors.confirmPassword ? "border-red-500" : ""}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {serverError}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !isFormValid()}
            className="w-full"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-center text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="text-teal-700 hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
