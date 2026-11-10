// TODO: Replace this mock with Better Auth's Google sign-in once it is wired
// up. Keep the exported signature so the login page doesn't have to change.

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "cancelled" | "unknown" };

const MOCK_DELAY_MS = 800;

// Mock only: sign-in always fails until Better Auth is connected, so the only
// way past the login page is its demo link. The failure is "unknown" by
// default; open /login?mockAuth=cancelled to see the cancelled message.
const MOCK_OUTCOME_PARAM = "mockAuth";

export async function signInWithGoogle(): Promise<SignInResult> {
  const outcome =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get(MOCK_OUTCOME_PARAM);

  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));

  return { ok: false, reason: outcome === "cancelled" ? "cancelled" : "unknown" };
}
