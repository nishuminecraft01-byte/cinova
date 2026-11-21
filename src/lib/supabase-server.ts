import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UserProfile } from "@/types/movie";
import { getPlanById, resolveEffectiveTier } from "@/lib/membership";
import { getAdminApiKey } from "@/lib/env";

export const SB_ACCESS_COOKIE = "cinova_sb_access_token";
export const SB_REFRESH_COOKIE = "cinova_sb_refresh_token";

export interface ServerAuthSession {
  configured: boolean;
  authenticated: boolean;
  user: UserProfile | null;
  isAdmin: boolean;
  diagnostics?: {
    userIdMasked?: string;
    emailMasked?: string;
    dbRoleResolved?: string;
    profileFound?: boolean;
    idMatch?: boolean;
    queryMethod?: "id" | "email" | "service_role" | "fallback_created" | "fallback_default";
    errorReason?: string;
  };
  refreshedTokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  };
}

function cleanEnvValue(val: string | undefined): string {
  return (val || "").trim().replace(/^["']|["']$/g, "");
}

function isRealEnvValue(val: string | undefined): boolean {
  const trimmed = cleanEnvValue(val);
  if (!trimmed) return false;
  if (
    trimmed.includes("placeholder") ||
    trimmed.includes("your-project") ||
    trimmed.includes("your_")
  ) {
    return false;
  }
  return true;
}

export const DEFAULT_SUPABASE_URL = "https://cokkdjkdudeedknjwmzh.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_OwzQUJsjKUDnO4JIbCvmIQ_OLidVyee";

/**
 * Reads Supabase public configuration from server environment variables.
 * Supports both modern Publishable keys (`sb_publishable_...`) and legacy JWT anon keys.
 * Falls back to project production defaults so auth is always active.
 * Does NOT require a Service Role key for normal user signup/login.
 */
export function getSupabasePublicConfig(): {
  url: string | null;
  anonKey: string | null;
  configured: boolean;
} {
  const envUrl = cleanEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const envAnonKey = cleanEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  const url = isRealEnvValue(envUrl) ? envUrl : DEFAULT_SUPABASE_URL;
  const anonKey = isRealEnvValue(envAnonKey) ? envAnonKey : DEFAULT_SUPABASE_ANON_KEY;

  const validUrl =
    isRealEnvValue(url) &&
    (url.startsWith("https://") || url.startsWith("http://"));
  const configured = validUrl && isRealEnvValue(anonKey);
  return {
    url: configured ? url : null,
    anonKey: configured ? anonKey : null,
    configured,
  };
}

export function isSupabaseAuthConfigured(): boolean {
  return getSupabasePublicConfig().configured;
}

/**
 * Next.js 14 App Router SSR Supabase client via @supabase/ssr.
 */
export async function createSupabaseSsrServerClient(): Promise<SupabaseClient | null> {
  const { url, anonKey, configured } = getSupabasePublicConfig();
  if (!configured || !url || !anonKey) return null;

  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot mutate cookies directly; Route Handlers/Middleware handle cookie writes
        }
      },
    },
  });
}

/**
 * Stateless server Supabase client using Project URL + Publishable/Anon key.
 * When `accessToken` is provided, sends `Authorization: Bearer <jwt>` alongside `apikey`
 * so Postgres RLS evaluates `auth.uid()` strictly as the verified user without gateway rejection.
 */
export function createSupabaseServerAnonClient(accessToken?: string): SupabaseClient | null {
  const { url, anonKey, configured } = getSupabasePublicConfig();
  if (!configured || !url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        apikey: anonKey,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
    },
  });
}

/**
 * Server-only service role client. NEVER import this module into client components,
 * and NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 * Supports SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, and SUPABASE_SERVICE_KEY.
 */
export function createSupabaseServiceClient(): SupabaseClient | null {
  const { url, configured } = getSupabasePublicConfig();
  const serviceKey =
    (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_KEY
    )?.trim() || "";
  if (!configured || !url || !isRealEnvValue(serviceKey)) return null;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function setAuthSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number = 3600
): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(SB_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: Math.max(300, expiresInSeconds),
  });
  response.cookies.set(SB_REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export function clearAuthSessionCookies(response: NextResponse): void {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(SB_ACCESS_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
  response.cookies.set(SB_REFRESH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 0,
  });
}

export function maskIdentifier(val?: string | null): string {
  if (!val) return "unknown";
  const str = String(val).trim();
  if (str.includes("@")) {
    const [local, domain] = str.split("@");
    const maskedLocal =
      local.length <= 2 ? `${local[0]}*` : `${local.slice(0, 2)}***${local.slice(-1)}`;
    return `${maskedLocal}@${domain || "masked"}`;
  }
  if (str.length <= 8) return str.slice(0, 2) + "...";
  return `${str.slice(0, 4)}...${str.slice(-4)}`;
}

export function normalizeProfileRole(raw?: unknown): "user" | "creator" | "admin" {
  if (typeof raw !== "string") return "user";
  const normalized = raw.trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "creator") return "creator";
  return "user";
}

export interface ProfileFetchResult {
  user: UserProfile;
  diagnostics: {
    userIdMasked: string;
    emailMasked: string;
    dbRoleResolved: "user" | "creator" | "admin";
    profileFound: boolean;
    idMatch: boolean;
    queryMethod?: "id" | "email" | "service_role" | "fallback_created" | "fallback_default";
    errorReason?: string;
  };
}

export async function fetchVerifiedUserProfile(
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  accessToken: string
): Promise<UserProfile> {
  const result = await fetchVerifiedUserProfileWithDiagnostics(authUser, accessToken);
  return result.user;
}

export async function fetchVerifiedUserProfileWithDiagnostics(
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> },
  accessToken: string
): Promise<ProfileFetchResult> {
  const userClient = createSupabaseServerAnonClient(accessToken);
  const serviceClient = createSupabaseServiceClient();

  let profileRow: {
    id: string;
    email?: string | null;
    name?: string | null;
    role?: string | null;
    avatar?: string | null;
    tier?: string | null;
    plan_expiry?: string | null;
  } | null = null;

  let queryMethod: "id" | "email" | "service_role" | "fallback_created" | "fallback_default" =
    "fallback_default";
  let idMatch = false;
  let queryError: string | undefined;

  // 1. Authoritative Service-Role Lookup (when configured in server environment)
  // Identity was already independently verified cryptographically above via supabase.auth.getUser()
  if (serviceClient) {
    try {
      const { data, error } = await serviceClient
        .from("profiles")
        .select("id, email, name, role, avatar, tier, plan_expiry")
        .eq("id", authUser.id)
        .maybeSingle();

      if (data) {
        profileRow = data;
        queryMethod = "service_role";
        idMatch = true;
      } else if (error) {
        queryError = `Service-role error ${error.code}: ${error.message}`;
        console.warn(`[CINOVA Server Auth] Service-role profile query failed: ${queryError}`);
      }
    } catch (err: any) {
      console.warn(`[CINOVA Server Auth] Service-role exception querying profiles:`, err?.message);
    }
  }

  // 2. User-Scoped Authenticated Lookup with RLS (standard path when service-role key is not present)
  // Queries public.profiles under Postgres role 'authenticated' with RLS (auth.uid() = id)
  if (!profileRow && userClient) {
    try {
      const { data, error } = await userClient
        .from("profiles")
        .select("id, email, name, role, avatar, tier, plan_expiry")
        .eq("id", authUser.id)
        .maybeSingle();

      if (data) {
        profileRow = data;
        queryMethod = "id";
        idMatch = true;
      } else if (error) {
        queryError = `PostgREST error ${error.code}: ${error.message}`;
        queryError = `PostgREST error ${error.code}: ${error.message} | Hint: ${error.hint} | Details: ${error.details}`;
        // Safe diagnostic logging without exposing private tokens or secrets
        console.warn(
          `[CINOVA Server Auth] Authenticated user profile query by id failed for ${maskIdentifier(authUser.id)}: ${queryError}`
        );

        // Security-Definer RPC fallback: if table-level grant is missing, try get_my_profile() RPC
        try {
          const { data: rpcProfile, error: rpcErr } = await userClient.rpc("get_my_profile");
          if (rpcProfile && !rpcErr) {
            const parsed = typeof rpcProfile === "string" ? JSON.parse(rpcProfile) : rpcProfile;
            if (parsed && typeof parsed === "object" && parsed.id === authUser.id) {
              profileRow = parsed;
              queryMethod = "id";
              idMatch = true;
              queryError = undefined;
            }
          }
        } catch {
          // RPC not configured yet; continue
        }
      }
    } catch (err: any) {
      queryError = `Exception: ${err?.message || "Unknown"}`;
      console.warn(`[CINOVA Server Auth] Exception querying profiles by id:`, err?.message);
    }
  }

  // 3. Fallback recovery by verified email (only if row was not found by authUser.id)
  if (!profileRow && authUser.email) {
    const recoveryClient = serviceClient || userClient;
    if (recoveryClient) {
      try {
        const { data, error } = await recoveryClient
          .from("profiles")
          .select("id, email, name, role, avatar, tier, plan_expiry")
          .ilike("email", authUser.email.trim())
          .maybeSingle();

        if (data) {
          profileRow = data;
          queryMethod = "email";
          idMatch = data.id === authUser.id;
          if (!idMatch) {
            console.warn(
              `[CINOVA Server Auth] Profile resolved by verified email, but ID mismatch detected: database profiles.id=${maskIdentifier(data.id)} vs auth.users.id=${maskIdentifier(authUser.id)}. Role in database: '${data.role}'.`
            );
            if (serviceClient) {
              await serviceClient
                .from("profiles")
                .update({ id: authUser.id })
                .eq("email", authUser.email.trim());
            }
          }
        } else if (error) {
          console.warn(
            `[CINOVA Server Auth] Fallback query by email failed for ${maskIdentifier(authUser.email)}: ${error.message} | Hint: ${error.hint} | Details: ${error.details}`
          );
        }
      } catch (err: any) {
        console.warn(`[CINOVA Server Auth] Exception querying profiles by email:`, err?.message);
      }
    }
  }

  // 4. If row still does not exist (and no database query error occurred), attempt safe profile auto-creation (Free/user)
  if (!profileRow && !queryError && (userClient || serviceClient)) {
    const clientToUse = serviceClient || userClient;
    try {
      const defaultName = authUser.email ? authUser.email.split("@")[0] : "CINOVA Member";
      const { data: inserted } = await clientToUse!
        .from("profiles")
        .insert({
          id: authUser.id,
          email: authUser.email || "",
          name: defaultName,
          role: "user",
          tier: "Free",
        })
        .select("id, email, name, role, avatar, tier, plan_expiry")
        .maybeSingle();

      if (inserted) {
        profileRow = inserted;
        queryMethod = "fallback_created";
        idMatch = true;
      }
    } catch {
      // Non-blocking
    }
  }

    const dbRole = normalizeProfileRole(profileRow?.role);
    const dbTier = typeof profileRow?.tier === "string" ? profileRow.tier : "Free";
    const dbName = typeof profileRow?.name === "string" ? profileRow.name : null;
    const dbAvatar = typeof profileRow?.avatar === "string" ? profileRow.avatar : null;
    const dbPlanExpiry =
      typeof profileRow?.plan_expiry === "string" ? profileRow.plan_expiry : undefined;

    const email = authUser.email || "";
    const metadataName =
      typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : typeof authUser.user_metadata?.full_name === "string"
          ? authUser.user_metadata.full_name
          : "";
    const effectiveTier = resolveEffectiveTier(dbTier, dbRole);
    const plan = getPlanById(effectiveTier);

    const userProfile: UserProfile = {
      id: authUser.id,
      email,
      name: dbName || metadataName || (email ? email.split("@")[0] : "CINOVA Member"),
      role: dbRole,
      avatar: dbAvatar || "",
      tier: effectiveTier,
      subscription: plan.name,
      planExpiry: dbPlanExpiry,
    };

    return {
      user: userProfile,
      diagnostics: {
        userIdMasked: maskIdentifier(authUser.id),
        emailMasked: maskIdentifier(authUser.email),
        dbRoleResolved: dbRole,
        profileFound: Boolean(profileRow),
        idMatch,
        queryMethod,
        errorReason: queryError,
      },
    };
  }

  /**
   * Verifies the authenticated Supabase Auth session on the server.
   * Never trusts client-provided roles, localStorage, or unsigned headers.
   */
  export async function getServerAuthSession(
    request?: NextRequest
  ): Promise<ServerAuthSession> {
    if (!isSupabaseAuthConfigured()) {
      return {
        configured: false,
        authenticated: false,
        user: null,
        isAdmin: false,
      };
    }

    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    if (request) {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.toLowerCase().startsWith("bearer ")) {
        const candidate = authHeader.slice(7).trim();
        if (candidate && candidate !== getAdminApiKey()) {
          accessToken = candidate;
        }
      }
      if (!accessToken) {
        accessToken = request.cookies.get(SB_ACCESS_COOKIE)?.value;
      }
      refreshToken = request.cookies.get(SB_REFRESH_COOKIE)?.value;
    } else {
      const cookieStore = await cookies();
      accessToken = cookieStore.get(SB_ACCESS_COOKIE)?.value;
      refreshToken = cookieStore.get(SB_REFRESH_COOKIE)?.value;
    }

    if (!accessToken && !refreshToken) {
      return {
        configured: true,
        authenticated: false,
        user: null,
        isAdmin: false,
      };
    }

    const supabase = createSupabaseServerAnonClient();
    if (!supabase) {
      return {
        configured: false,
        authenticated: false,
        user: null,
        isAdmin: false,
      };
    }

    // 1. Verify existing access token directly with Supabase Auth server
    if (accessToken) {
      try {
        const { data, error } = await supabase.auth.getUser(accessToken);
        if (!error && data?.user) {
          const { user: profile, diagnostics } =
            await fetchVerifiedUserProfileWithDiagnostics(data.user, accessToken);
          return {
            configured: true,
            authenticated: true,
            user: profile,
            isAdmin: profile.role === "admin",
            diagnostics,
          };
        }
      } catch {
        // Fall through to refresh token attempt
      }
    }

    // 2. If access token expired and refresh token cookie exists, refresh cleanly server-side
    if (refreshToken) {
      try {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (!error && data?.session && data?.user) {
          const { user: profile, diagnostics } =
            await fetchVerifiedUserProfileWithDiagnostics(
              data.user,
              data.session.access_token
            );
          return {
            configured: true,
            authenticated: true,
            user: profile,
            isAdmin: profile.role === "admin",
            diagnostics,
            refreshedTokens: {
              accessToken: data.session.access_token,
              refreshToken: data.session.refresh_token,
              expiresIn: data.session.expires_in,
            },
          };
        }
      } catch {
        // Invalid or revoked refresh token
      }
    }

    return {
      configured: true,
      authenticated: false,
      user: null,
      isAdmin: false,
    };
  }

  function isValidAdminApiKey(request?: NextRequest): boolean {
    if (!request) return false;
    const expectedKey = getAdminApiKey();
    if (!expectedKey) return false;

    const headerKey = request.headers.get("x-admin-api-key")?.trim();
    const authHeader = request.headers.get("authorization")?.trim();
    const bearerKey = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : undefined;

    const provided = headerKey || bearerKey;
    if (!provided) return false;

    if (expectedKey.length !== provided.length) return false;
    let res = 0;
    for (let i = 0; i < expectedKey.length; i++) {
      res |= expectedKey.charCodeAt(i) ^ provided.charCodeAt(i);
    }
    return res === 0;
  }

  export interface AdminGuardResult {
    ok: boolean;
    status: number;
    error?: string;
    session: ServerAuthSession;
  }

  /**
   * Authoritative server-side admin verification for API routes and server actions.
   */
  export async function requireAdminSession(
    request?: NextRequest
  ): Promise<AdminGuardResult> {
    if (isValidAdminApiKey(request)) {
      return {
        ok: true,
        status: 200,
        session: {
          configured: isSupabaseAuthConfigured(),
          authenticated: true,
          user: null,
          isAdmin: true,
        },
      };
    }

    const session = await getServerAuthSession(request);

    if (!session.configured) {
      return {
        ok: false,
        status: 503,
        error: "SUPABASE_AUTH_NOT_CONFIGURED",
        session,
      };
    }

    if (!session.authenticated || !session.user) {
      return {
        ok: false,
        status: 401,
        error: "UNAUTHORIZED_ADMIN_ACCESS",
        session,
      };
    }

    if (!session.isAdmin) {
      const roleReport = session.user?.role || "none";
      const userReport = session.diagnostics?.userIdMasked || "anonymous";
      console.warn(
        `[CINOVA Admin Guard] User ${userReport} denied admin access. Database role resolved: '${roleReport}'. Profile found: ${session.diagnostics?.profileFound}. ID match: ${session.diagnostics?.idMatch}`
      );
      return {
        ok: false,
        status: 403,
        error: "FORBIDDEN_ADMIN_ROLE_REQUIRED",
        session,
      };
    }

    return {
      ok: true,
      status: 200,
      session,
    };
  }
