/**
 * Authentication & Rate Limiting Middleware
 *
 * CRITICAL FIX: Auth is now REQUIRED by default, not opt-in.
 * Previously, if CRON_SECRET was unset, all endpoints were wide open.
 */
import { NextRequest, NextResponse } from "next/server";

// --- Auth Verification ---

export function verifyAuth(request: NextRequest): NextResponse | null {
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.error("[Auth] CRON_SECRET is not configured. All protected endpoints are locked.");
    return NextResponse.json(
      { success: false, error: "Server misconfiguration: auth not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

// --- Input Validation ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface WebhookPayload {
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  phone?: string;
  firmName: string;
  registrationType?: string;
  researchInterest?: string;
  source?: string;
  city?: string;
  state?: string;
  country?: string;
}

export function validateWebhookPayload(
  body: unknown
): [WebhookPayload | null, string | null] {
  if (!body || typeof body !== "object") {
    return [null, "Request body must be a JSON object"];
  }

  const b = body as Record<string, unknown>;

  const required = ["firstName", "lastName", "email", "firmName"] as const;
  for (const field of required) {
    if (!b[field] || typeof b[field] !== "string" || !(b[field] as string).trim()) {
      return [null, `Missing or empty required field: ${field}`];
    }
  }

  const email = (b.email as string).trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return [null, "Invalid email format"];
  }

  const stringFields = [
    "firstName", "lastName", "email", "title", "phone",
    "firmName", "registrationType", "researchInterest",
    "source", "city", "state", "country",
  ];
  for (const field of stringFields) {
    if (b[field] && typeof b[field] === "string" && (b[field] as string).length > 500) {
      return [null, `Field ${field} exceeds maximum length (500 chars)`];
    }
  }

  const clean: WebhookPayload = {
    firstName: (b.firstName as string).trim(),
    lastName: (b.lastName as string).trim(),
    email,
    firmName: (b.firmName as string).trim(),
    title: typeof b.title === "string" ? b.title.trim() : undefined,
    phone: typeof b.phone === "string" ? b.phone.trim() : undefined,
    registrationType: typeof b.registrationType === "string" ? b.registrationType.trim() : undefined,
    researchInterest: typeof b.researchInterest === "string" ? b.researchInterest.trim() : undefined,
    source: typeof b.source === "string" ? b.source.trim() : undefined,
    city: typeof b.city === "string" ? b.city.trim() : undefined,
    state: typeof b.state === "string" ? b.state.trim() : undefined,
    country: typeof b.country === "string" ? b.country.trim() : undefined,
  };

  return [clean, null];
}

// --- Rate Limiting (in-memory, per-IP) ---

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return null;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return NextResponse.json(
      { success: false, error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  return null;
}
