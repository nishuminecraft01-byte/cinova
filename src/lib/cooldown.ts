/**
 * Persistent Cooldown Manager for CINOVA Auth
 * Stores expiration timestamps in localStorage so cooldowns persist across
 * page reloads, tab switches, and browser restarts.
 */

const STORAGE_PREFIX = "cinova_cooldown_";

export function getPersistentCooldown(key: string = "auth"): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return 0;
    const expiry = parseInt(raw, 10);
    if (isNaN(expiry)) return 0;
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    if (remaining <= 0) {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return 0;
    }
    return remaining;
  } catch {
    return 0;
  }
}

export function setPersistentCooldown(key: string = "auth", seconds: number = 60): void {
  if (typeof window === "undefined" || seconds <= 0) return;
  try {
    const expiry = Date.now() + seconds * 1000;
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(expiry));
  } catch {
    // Ignore storage quota/permission limitations
  }
}

export function clearPersistentCooldown(key: string = "auth"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore
  }
}
