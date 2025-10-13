// Validation helpers for auth forms

export function validateEmail(email) {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";

  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return "Invalid email format";

  return null; // valid
}

export function validatePassword(password) {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";

  // Check for 1 uppercase, 1 lowercase, 1 number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase) return "Password must contain at least 1 uppercase letter";
  if (!hasLowercase) return "Password must contain at least 1 lowercase letter";
  if (!hasNumber) return "Password must contain at least 1 number";

  return null; // valid
}

export function validateUsername(username) {
  const trimmed = username.trim();
  if (!trimmed) return "Username is required";
  if (trimmed.length < 3) return "Username must be at least 3 characters";
  if (trimmed !== username) return "Username cannot have leading/trailing spaces";

  return null; // valid
}

export function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) return "Please confirm your password";
  if (password !== confirmPassword) return "Passwords do not match";

  return null; // valid
}
