export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length > 100) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters long" };
  }
  if (trimmed.length > 30) {
    return { isValid: false, error: "Username cannot exceed 30 characters" };
  }
  const usernameRegex = /^[a-zA-Z0-9_.]+$/;
  if (!usernameRegex.test(trimmed)) {
    return { isValid: false, error: "Username can only contain alphanumeric characters, underscores, and dots" };
  }
  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8) {
    return { isValid: false, error: "Password must be at least 8 characters long" };
  }
  if (password.length > 100) {
    return { isValid: false, error: "Password cannot exceed 100 characters" };
  }
  return { isValid: true };
}
