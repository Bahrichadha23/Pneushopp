// API service for backend communication
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    is_verified: boolean;
    is_staff: boolean;
  };
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}

export interface ApiError {
  error?: string;
  message?: string;
  [key: string]: any;
}

// Helper: safely parse JSON
async function safeJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || "Invalid JSON response from server");
  }
}

// --- API Functions ---

// Login user
export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.error || error.message || "Login failed");
  }

  return safeJson(response);
}

// Register user
export async function registerUser(userData: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.error || error.message || "Registration failed");
  }

  return safeJson(response);
}

// Verify email
export async function verifyEmail(userId: string, code: string) {
  const response = await fetch(`${API_URL}/api/auth/verify-email/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, code }),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.error || error.message || "Verification failed");
  }

  return safeJson(response);
}

// Get user profile
export async function getUserProfile(token: string) {
  const response = await fetch(`${API_URL}/api/auth/user/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.error || error.message || "Failed to get user profile");
  }

  return safeJson(response);
}

// Refresh token
export async function refreshToken(refreshToken: string) {
  const response = await fetch(`${API_URL}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.error || error.message || "Token refresh failed");
  }

  return safeJson(response);
}

// Forgot password
export async function forgotPassword(email: string) {
  const response = await fetch(`${API_URL}/api/auth/forgot-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.error || error.message || "Failed to send reset code");
  }

  return safeJson(response);
}

// Reset password
export async function resetPassword(email: string, code: string, newPassword: string) {
  const response = await fetch(`${API_URL}/api/auth/reset-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });

  if (!response.ok) {
    const error = await safeJson(response);
    throw new Error(error.error || error.message || "Password reset failed");
  }

  return safeJson(response);
}
