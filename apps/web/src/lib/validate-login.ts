import { POST_SIGN_IN_ROUTE } from "./routes";

/** The sign-in failures the login page has a message for. */
export type LoginError = "cancelled" | "server_error";

export type LoginParams = {
  /** A path inside this app. Always safe to hand to the router. */
  next: string;
  error: LoginError | null;
};

/** Either a URLSearchParams or the plain object Next.js gives a page. */
export type RawLoginParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

// Codes that mean the user backed out. "access_denied" is the OAuth 2.0 code
// a provider sends when the user declines on its consent screen.
// TODO: Confirm the exact codes Better Auth passes back once it is wired up.
const CANCELLED_CODES = new Set(["access_denied"]);

// Only used to check that a path stays on one origin. Nothing is fetched.
const PLACEHOLDER_ORIGIN = "http://app.invalid";

/**
 * Checks the query string of the login page: where to go after sign-in
 * (`next`) and why the last attempt failed (`error`).
 *
 * Pure: no window, no router. Both values come from the URL, so anyone can
 * set them. Neither is trusted or shown to the user as it arrived.
 */
export function validateLogin(params: RawLoginParams): LoginParams {
  return {
    next: validateNext(read(params, "next")),
    error: validateError(read(params, "error")),
  };
}

/** The raw value of a param: undefined if absent, an array if repeated. */
function read(
  params: RawLoginParams,
  key: string,
): string | string[] | undefined {
  if (params instanceof URLSearchParams) {
    const values = params.getAll(key);
    if (values.length === 0) return undefined;
    return values.length === 1 ? values[0] : values;
  }
  return Object.hasOwn(params, key) ? params[key] : undefined;
}

function validateNext(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !isSameAppPath(value)) {
    return POST_SIGN_IN_ROUTE;
  }

  // Check the decoded form too, so "/%2Fevil.com" can't turn into
  // "//evil.com" further down the line.
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return POST_SIGN_IN_ROUTE;
  }
  return isSameAppPath(decoded) ? value : POST_SIGN_IN_ROUTE;
}

function isSameAppPath(path: string): boolean {
  // Must start with exactly one slash. "//host" is another site.
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  // Browsers read "\" as "/" and drop tabs and newlines, so "/\host" and
  // "/<tab>/host" also leave the app. A real path needs none of these.
  if (/[\\\u0000-\u001f\u007f]/.test(path)) return false;

  try {
    return new URL(path, PLACEHOLDER_ORIGIN).origin === PLACEHOLDER_ORIGIN;
  } catch {
    return false;
  }
}

function validateError(value: string | string[] | undefined): LoginError | null {
  if (value === undefined) return null;
  if (typeof value === "string" && CANCELLED_CODES.has(value)) {
    return "cancelled";
  }
  // Every other code, known or not, gets the generic message. The raw code
  // never reaches the page.
  return "server_error";
}
