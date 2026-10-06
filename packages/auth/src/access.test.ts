import { describe, expect, test } from "bun:test";

import { decideAccess, type AccessPolicy, type AccessSubject } from "./access";

const policy: AccessPolicy = {
  allowedEmails: ["member@example.com", "admin@example.com"],
  allowedDomain: "company.test",
  adminEmails: ["admin@example.com"],
};

function subject(overrides: Partial<NonNullable<AccessSubject>>): AccessSubject {
  return {
    userId: "user-1",
    email: "member@example.com",
    emailVerified: true,
    role: "member",
    ...overrides,
  };
}

describe("decideAccess", () => {
  test("missing session is unauthorized", () => {
    expect(decideAccess({ subject: null, policy, requiredRole: "member" })).toBe("unauthorized");
  });

  test("allowlist failure is forbidden even for an admin role", () => {
    expect(
      decideAccess({
        subject: subject({ email: "outsider@example.com", role: "admin" }),
        policy,
        requiredRole: "member",
      }),
    ).toBe("forbidden");
  });

  test("unverified email is forbidden", () => {
    expect(
      decideAccess({
        subject: subject({ emailVerified: false }),
        policy,
        requiredRole: "member",
      }),
    ).toBe("forbidden");
  });

  test("allowed member can use member routes", () => {
    expect(
      decideAccess({
        subject: subject({ email: "Member@Example.com" }),
        policy,
        requiredRole: "member",
      }),
    ).toBe("ok");
  });

  test("workspace domain is allowed", () => {
    expect(
      decideAccess({
        subject: subject({ email: "person@company.test" }),
        policy,
        requiredRole: "member",
      }),
    ).toBe("ok");
  });

  test("member is forbidden from admin routes", () => {
    expect(
      decideAccess({
        subject: subject({}),
        policy,
        requiredRole: "admin",
      }),
    ).toBe("forbidden");
  });

  test("admin on the allowlist can use admin routes", () => {
    expect(
      decideAccess({
        subject: subject({ email: "admin@example.com", role: "admin", userId: "admin-1" }),
        policy,
        requiredRole: "admin",
      }),
    ).toBe("ok");
  });
});
