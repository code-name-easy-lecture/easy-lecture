// TODO: Replace this mock with Better Auth's Google sign-in once it is wired
// up. Keep the exported signature so the login page doesn't have to change.
// The real flow leaves the page for Google and comes back with any failure in
// the URL, which validateLogin already reads.

import type { LoginError } from "@/lib/validate-login";
import { startMockSession } from "./mockSession";

export type SignInResult = { ok: true } | { ok: false; reason: LoginError };

const MOCK_DELAY_MS = 800;

// Mock only: sign-in succeeds and starts a fake session. To see a failure,
// open /login?mockAuth=cancelled or /login?mockAuth=error.
const MOCK_OUTCOME_PARAM = "mockAuth";

export async function signInWithGoogle(): Promise<SignInResult> {
  const outcome =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get(MOCK_OUTCOME_PARAM);

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  if (outcome === "cancelled") return { ok: false, reason: "cancelled" };
  if (outcome === "error") return { ok: false, reason: "server_error" };

  startMockSession();
  return { ok: true };
}
