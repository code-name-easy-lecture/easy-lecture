import type { Metadata } from "next";
import { validateLogin } from "@/lib/validate-login";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Sign in · Easy Lecture",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  // The query string is checked on the server, so the browser only ever gets
  // a safe path and one of our own error names.
  const { next, error } = validateLogin(await searchParams);

  return <LoginForm next={next} initialError={error} />;
}
