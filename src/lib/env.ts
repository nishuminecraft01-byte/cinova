/**
 * Server-side environment validation and safe configuration helpers.
 * Never import this file from client components.
 */

export interface ServerEnvStatus {
  databaseConfigured: boolean;
  directUrlConfigured: boolean;
  tmdbConfigured: boolean;
  cronSecretConfigured: boolean;
  adminApiKeyConfigured: boolean;
  defaultCountryCode: string;
}

const VALID_ISO2_REGEX = /^[A-Z]{2}$/;

function isNonEmptyRealValue(val: string | undefined): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.includes("placeholder") || trimmed.includes("your-project")) return false;
  return true;
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!isNonEmptyRealValue(url)) return false;
  return Boolean(
    url &&
      (url.startsWith("postgresql://") ||
        url.startsWith("postgres://") ||
        url.startsWith("prisma://") ||
        url.startsWith("prisma+postgres://"))
  );
}

export function getTmdbReadAccessToken(): string | null {
  const token =
    process.env.TMDB_API_READ_ACCESS_TOKEN ||
    process.env.TMDB_READ_ACCESS_TOKEN;
  return isNonEmptyRealValue(token) ? token!.trim() : null;
}

export function getTmdbApiKey(): string | null {
  const key = process.env.TMDB_API_KEY;
  return isNonEmptyRealValue(key) ? key!.trim() : null;
}

export function getCronSecret(): string | null {
  const secret = process.env.CRON_SECRET;
  return isNonEmptyRealValue(secret) ? secret!.trim() : null;
}

export function getAdminApiKey(): string | null {
  const key = process.env.ADMIN_API_KEY;
  return isNonEmptyRealValue(key) ? key!.trim() : null;
}

export function getDefaultCountryCode(): string {
  const raw = (process.env.DEFAULT_COUNTRY_CODE || "US").trim().toUpperCase();
  return VALID_ISO2_REGEX.test(raw) ? raw : "US";
}

/**
 * Returns non-secret boolean status of required server environment variables.
 * Safe for admin diagnostics and health checks (never exposes secret values).
 */
export function getServerEnvStatus(): ServerEnvStatus {
  return {
    databaseConfigured: isDatabaseConfigured(),
    directUrlConfigured: isNonEmptyRealValue(process.env.DIRECT_URL),
    tmdbConfigured: Boolean(getTmdbReadAccessToken() || getTmdbApiKey()),
    cronSecretConfigured: Boolean(getCronSecret()),
    adminApiKeyConfigured: Boolean(getAdminApiKey()),
    defaultCountryCode: getDefaultCountryCode(),
  };
}
