import { describe, expect, test } from "vitest";
import { POST_SIGN_IN_ROUTE } from "./routes";
import { validateLogin } from "./validate-login";

const query = (search: string) => validateLogin(new URLSearchParams(search));

describe("validateLogin", () => {
  test("missing params fall back to the courses page with no error", () => {
    expect(query("")).toEqual({ next: "/courses", error: null });
    expect(validateLogin({})).toEqual({ next: "/courses", error: null });
  });

  test("the fallback is the post sign-in route", () => {
    expect(query("").next).toBe(POST_SIGN_IN_ROUTE);
  });

  test("accepts the plain object Next.js gives a page", () => {
    expect(
      validateLogin({ next: "/courses/calc3", error: "access_denied" }),
    ).toEqual({ next: "/courses/calc3", error: "cancelled" });
  });

  test("ignores keys that only exist on the object prototype", () => {
    expect(validateLogin(Object.create({ next: "/courses/calc3" }))).toEqual({
      next: "/courses",
      error: null,
    });
  });
});

describe("next", () => {
  test.each([
    "/courses",
    "/courses?x=1",
    "/courses/calc3/triple-integrals",
    "/courses?x=1&y=2#top",
    "/courses/week%209",
    "/",
  ])("allows the same-app path %s", (path) => {
    expect(validateLogin({ next: path }).next).toBe(path);
  });

  test("keeps a path's own query string when read from a real URL", () => {
    expect(query("next=%2Fcourses%3Fx%3D1").next).toBe("/courses?x=1");
  });

  test.each([
    ["an absolute URL", "https://evil.com"],
    ["an absolute URL with a path", "https://evil.com/courses"],
    ["a scheme-relative URL", "//evil.com"],
    ["a slash then a backslash", "/\\evil.com"],
    ["a backslash anywhere", "/courses\\..\\evil"],
    ["an encoded second slash", "/%2Fevil.com"],
    ["an encoded second slash, lower case", "/%2fevil.com"],
    ["an encoded backslash", "/%5Cevil.com"],
    ["a fully encoded //", "%2F%2Fevil.com"],
    ["a tab between the slashes", "/\t/evil.com"],
    ["an encoded tab between the slashes", "/%09/evil.com"],
    ["a newline", "/courses\nSet-Cookie: x=1"],
    ["a javascript: URL", "javascript:alert(1)"],
    ["a data: URL", "data:text/html,hi"],
    ["a relative path", "courses"],
    ["a host with no scheme", "evil.com"],
    ["a leading space", " /courses"],
    ["a broken percent escape", "/courses/%E0%A4%A"],
    ["a lone percent sign", "/courses/100%"],
    ["an empty string", ""],
  ])("rejects %s", (_name, value) => {
    expect(validateLogin({ next: value }).next).toBe("/courses");
  });

  test("rejects an encoded // read from a real URL", () => {
    expect(query("next=%2F%2Fevil.com").next).toBe("/courses");
    expect(query("next=%252F%252Fevil.com").next).toBe("/courses");
    expect(query("next=https%3A%2F%2Fevil.com").next).toBe("/courses");
  });

  test("rejects a repeated param instead of guessing which one to use", () => {
    expect(query("next=/courses/calc3&next=//evil.com").next).toBe("/courses");
    expect(validateLogin({ next: ["/courses/calc3", "/"] }).next).toBe(
      "/courses",
    );
  });
});

describe("error", () => {
  test("no error param means no error", () => {
    expect(query("next=/courses").error).toBeNull();
  });

  test("maps the provider's access_denied code to cancelled", () => {
    expect(query("error=access_denied").error).toBe("cancelled");
  });

  test.each([
    ["a known Better Auth code", "state_mismatch"],
    ["another known Better Auth code", "unable_to_create_user"],
    ["an unknown code", "something_new"],
    ["the cancelled code in the wrong case", "ACCESS_DENIED"],
    ["an empty value", ""],
    ["markup", "<script>alert(1)</script>"],
    ["an object key", "constructor"],
  ])("maps %s to the generic server error", (_name, code) => {
    expect(validateLogin({ error: code }).error).toBe("server_error");
  });

  test("a repeated error param is the generic server error", () => {
    expect(query("error=access_denied&error=access_denied").error).toBe(
      "server_error",
    );
  });

  test("never returns the raw code", () => {
    const result = validateLogin({ next: "//evil.com", error: "evil_code" });
    expect(JSON.stringify(result)).not.toContain("evil");
  });
});
