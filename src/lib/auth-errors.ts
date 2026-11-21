export type AuthErrorCode =
  | "RATE_LIMIT_EXCEEDED"
  | "USER_ALREADY_EXISTS"
  | "EMAIL_NOT_CONFIRMED"
  | "INVALID_CREDENTIALS"
  | "WEAK_PASSWORD"
  | "INVALID_EMAIL"
  | "SETUP_REQUIRED"
  | "UNKNOWN_ERROR";

export interface ParsedAuthError {
  code: AuthErrorCode;
  message: string;
  isRateLimit: boolean;
  isEmailNotConfirmed: boolean;
  isUserAlreadyExists: boolean;
  retryAfterSeconds?: number;
}

/**
 * Normalizes raw Supabase / network errors into clean, user-friendly messages.
 * Prevents technical jargon and clearly explains rate limits and next steps.
 */
export function parseAuthError(rawError: unknown, defaultMsg = "An error occurred"): ParsedAuthError {
  const errObj = typeof rawError === "object" && rawError !== null ? (rawError as Record<string, unknown>) : {};
  const message =
    typeof rawError === "string"
      ? rawError
      : typeof errObj.message === "string"
      ? errObj.message
      : typeof errObj.error === "string"
      ? errObj.error
      : defaultMsg;

  const lower = message.toLowerCase();
  const status = typeof errObj.status === "number" ? errObj.status : 0;
  const rawCode = typeof errObj.code === "string" ? errObj.code.toLowerCase() : "";

  // 1. Rate Limit Exceeded
  if (
    status === 429 ||
    rawCode.includes("rate_limit") ||
    rawCode.includes("over_email_send_rate_limit") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("try again in")
  ) {
    return {
      code: "RATE_LIMIT_EXCEEDED",
      message:
        "Email delivery rate limit reached. Supabase's built-in email provider allows a limited number of messages per hour. Please wait a few minutes before trying again.",
      isRateLimit: true,
      isEmailNotConfirmed: false,
      isUserAlreadyExists: false,
      retryAfterSeconds: 60,
    };
  }

  // 2. User Already Registered
  if (
    rawCode.includes("user_already_exists") ||
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("already in use")
  ) {
    return {
      code: "USER_ALREADY_EXISTS",
      message: "An account with this email address already exists. Please sign in or reset your password.",
      isRateLimit: false,
      isEmailNotConfirmed: false,
      isUserAlreadyExists: true,
    };
  }

  // 3. Email Not Confirmed
  if (
    rawCode.includes("email_not_confirmed") ||
    lower.includes("not confirmed") ||
    lower.includes("unconfirmed")
  ) {
    return {
      code: "EMAIL_NOT_CONFIRMED",
      message: "Your email address has not been confirmed yet. Please verify your email via the confirmation link.",
      isRateLimit: false,
      isEmailNotConfirmed: true,
      isUserAlreadyExists: false,
    };
  }

  // 4. Invalid Credentials
  if (
    rawCode.includes("invalid_credentials") ||
    rawCode.includes("invalid_grant") ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid email or password")
  ) {
    return {
      code: "INVALID_CREDENTIALS",
      message: "Invalid email or password. Please double-check your credentials and try again.",
      isRateLimit: false,
      isEmailNotConfirmed: false,
      isUserAlreadyExists: false,
    };
  }

  // 5. Weak Password
  if (
    rawCode.includes("weak_password") ||
    lower.includes("password should be at least") ||
    lower.includes("password is too weak")
  ) {
    return {
      code: "WEAK_PASSWORD",
      message: "Password must be at least 6 characters long.",
      isRateLimit: false,
      isEmailNotConfirmed: false,
      isUserAlreadyExists: false,
    };
  }

  // 6. Invalid Email
  if (lower.includes("valid email") || lower.includes("invalid email")) {
    return {
      code: "INVALID_EMAIL",
      message: "Please enter a valid email address.",
      isRateLimit: false,
      isEmailNotConfirmed: false,
      isUserAlreadyExists: false,
    };
  }

  // 7. Fallback Unknown
  return {
    code: "UNKNOWN_ERROR",
    message: message || defaultMsg,
    isRateLimit: false,
    isEmailNotConfirmed: false,
    isUserAlreadyExists: false,
  };
}
