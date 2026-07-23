import crypto from "crypto";
import { cookies } from "next/headers";

export const COOKIE_NAME = "admin_session";
export const MAX_AGE = 60 * 60 * 8; // 8 Stunden

function getSecret(): string | null {
  const secret = (process.env.ADMIN_PASSWORD ?? "").trim();
  return secret.length > 0 ? secret : null;
}

/**
 * Ist der Admin-Zugang serverseitig konfiguriert (ADMIN_PASSWORD gesetzt)?
 * Routen nutzen das, um eine klare Fehlermeldung zu liefern statt eines
 * irreführenden "Falsches Passwort".
 */
export function isAdminConfigured(): boolean {
  return getSecret() !== null;
}

function sign(value: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

/**
 * Vergleicht das eingegebene Passwort zeitkonstant über SHA-256-Digests,
 * damit weder Länge noch Inhalt des echten Passworts per Timing-Angriff
 * erraten werden können.
 *
 * Eingabe und Passwort werden vor dem Vergleich normalisiert (Leerzeichen
 * am Rand entfernt, Kleinschreibung), damit z. B. "admin26.6.27" genauso
 * akzeptiert wird wie "Admin26.6.27" – wie im Demo-Prototyp.
 *
 * Ist kein Passwort konfiguriert, schlägt der Vergleich immer fehl –
 * ein leeres/fehlendes ADMIN_PASSWORD darf niemals als Login durchgehen.
 */
export function checkPassword(input: string): boolean {
  const secret = getSecret();
  if (!secret) return false;

  const expected = secret.toLowerCase();
  const normalizedInput = input.trim().toLowerCase();
  const inputHash = crypto.createHash("sha256").update(normalizedInput).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(inputHash, expectedHash);
}

export function createSessionValue(): string | null {
  const issuedAt = Date.now().toString();
  const signature = sign(issuedAt);
  if (!signature) return null;
  return `${issuedAt}.${signature}`;
}

export function isValidSession(value: string | undefined): boolean {
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  // Ohne konfiguriertes Passwort kann keine Session gültig sein –
  // niemals werfen, sonst crasht jede Anfrage mit altem Cookie.
  const expectedSignature = sign(issuedAt);
  if (!expectedSignature) return false;

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
