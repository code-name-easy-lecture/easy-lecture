// TODO: Mock only. Delete this file when Better Auth is wired up. Its own
// HTTP-only session cookie replaces this one. The value here is not a secret
// and nothing may treat this cookie as proof of who the user is.

export const MOCK_SESSION_COOKIE = "easy-lecture.mock-session";

const ONE_DAY_SECONDS = 60 * 60 * 24;

/** Marks this browser as signed in, the way a real session cookie would. */
export function startMockSession() {
  document.cookie = `${MOCK_SESSION_COOKIE}=mock-user; Path=/; Max-Age=${ONE_DAY_SECONDS}; SameSite=Lax`;
}
