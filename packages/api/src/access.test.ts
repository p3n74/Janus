import type { Session } from "@whatsapp-crm/auth";
import type { AccessPolicy } from "@whatsapp-crm/auth/access";
import type { Database } from "@whatsapp-crm/db";
import { TRPCError } from "@trpc/server";
import { describe, expect, test } from "bun:test";

import type { Context } from "./context";
import { appRouter } from "./routers/index";

const policy: AccessPolicy = {
  allowedEmails: ["member@example.com", "admin@example.com"],
  allowedDomain: null,
  adminEmails: ["admin@example.com"],
};

const request = { ip: null, requestId: "test-request" };

function caller(session: Session | null) {
  const ctx: Context = {
    session,
    db: undefined as unknown as Database,
    policy,
    request,
  };
  return appRouter.createCaller(ctx);
}

function sessionFor(email: string, role: "admin" | "member"): Session {
  return {
    session: {
      id: "session-1",
      userId: role === "admin" ? "admin-1" : "user-1",
      token: "session-token-should-not-leak",
      expiresAt: new Date("2026-12-01T00:00:00.000Z"),
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
      updatedAt: new Date("2026-10-01T00:00:00.000Z"),
      ipAddress: null,
      userAgent: null,
    },
    user: {
      id: role === "admin" ? "admin-1" : "user-1",
      name: role,
      email,
      emailVerified: true,
      image: null,
      role,
      createdAt: new Date("2026-10-01T00:00:00.000Z"),
      updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    },
  } as Session;
}

async function expectCode(promise: Promise<unknown>, code: TRPCError["code"]) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(TRPCError);
    expect((error as TRPCError).code).toBe(code);
    return;
  }
  throw new Error(`expected ${code}`);
}

describe("access procedures", () => {
  test("health check stays public", async () => {
    expect(await caller(null).healthCheck()).toBe("OK");
  });

  test("missing session is unauthorized", async () => {
    await expectCode(caller(null).privateData(), "UNAUTHORIZED");
    await expectCode(caller(null).adminCheck(), "UNAUTHORIZED");
  });

  test("signed-in outsider is forbidden", async () => {
    const outsider = sessionFor("outsider@example.com", "member");
    await expectCode(caller(outsider).privateData(), "FORBIDDEN");
    await expectCode(caller(outsider).adminCheck(), "FORBIDDEN");
  });

  test("allowed member can read private data and cannot pass the admin check", async () => {
    const member = sessionFor("member@example.com", "member");
    expect((await caller(member).privateData()).message).toBe("This is private");
    await expectCode(caller(member).adminCheck(), "FORBIDDEN");
  });

  test("allowed admin passes the admin check", async () => {
    const admin = sessionFor("admin@example.com", "admin");
    expect(await caller(admin).adminCheck()).toEqual({ ok: true });
  });
});
