"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/auth/signIn";
import { POST_SIGN_IN_ROUTE } from "@/lib/routes";

const ERROR_MESSAGES = {
  cancelled:
    "Google sign-in was cancelled. You can try again whenever you're ready.",
  unknown: "Something went wrong while signing you in. Please try again.",
};

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The button uses aria-disabled rather than the native disabled attribute,
  // which would drop keyboard focus mid sign-in. This ref is what ignores
  // repeat clicks while a sign-in is in flight.
  const inFlight = useRef(false);

  async function handleSignIn() {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsLoading(true);
    setError(null);

    const result = await signInWithGoogle().catch(
      () => ({ ok: false, reason: "unknown" }) as const,
    );

    if (result.ok) {
      // Stay in the loading state while the redirect happens.
      router.replace(POST_SIGN_IN_ROUTE);
      return;
    }

    setError(ERROR_MESSAGES[result.reason]);
    setIsLoading(false);
    inFlight.current = false;
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      {/* TODO: Demo only. Remove once real sign-in is wired up. */}
      <Link
        href={POST_SIGN_IN_ROUTE}
        className="absolute top-4 right-4 rounded-full border border-accent px-4 py-2 text-sm font-medium text-accent outline-offset-2 outline-accent focus-visible:outline-2"
      >
        Demo: skip to courses
      </Link>
      <div className="flex w-full max-w-xl flex-col items-center gap-6">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Sign in to Easy Lecture
        </h1>
        <p className="text-lg leading-relaxed">
          Use your Google account to get to your courses.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          aria-disabled={isLoading}
          aria-busy={isLoading}
          className="inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-medium text-background outline-offset-2 outline-accent focus-visible:outline-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-80"
        >
          {isLoading && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:hidden"
            />
          )}
          {isLoading ? "Signing in…" : "Continue with Google"}
        </button>
        {/* Always rendered so screen readers announce the text when it appears. */}
        <p aria-live="polite" className="min-h-6 text-base font-medium">
          {error}
        </p>
      </div>
    </main>
  );
}
