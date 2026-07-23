import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "admin_session";
export const MAX_AGE = 60 * 60 * 8; // 8 Stunden

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD ist nicht gesetzt.");
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

/**
 * Vergleicht das eingegebene Passwort zeitkonstant über SHA-256-Digests,
 * damit weder Länge noch Inhalt des echten Passworts per Timing-Angriff
 * erraten werden können.
 *
 * Eingabe und Passwort werden vor dem Vergleich normalisiert (Leerzeichen
 * am Rand entfernt, Kleinschreibung), damit z. B. "admin26.6.27" genauso
 * akzeptiert wird wie "Admin26.6.27" – wie im Demo-Prototyp.
 */
export function checkPassword(input: string): boolean {
  const expected = (process.env.ADMIN_PASSWORD ?? "").trim().toLowerCase();
  const normalizedInput = input.trim().toLowerCase();
  const inputHash = crypto.createHash("sha256").update(normalizedInput).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(inputHash, expectedHash);
}

export function createSessionValue(): string {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function isValidSession(value: string | undefined): boolean {
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  const expectedSignature = sign(issuedAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  const age = Date.now() - Number(issuedAt);
  return age >= 0 && age <= MAX_AGE * 1000;
}

export async function getIsAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(COOKIE_NAME)?.value);
}
