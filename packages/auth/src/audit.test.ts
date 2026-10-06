import { describe, expect, test } from "bun:test";

import { recordAudit, type AuditEvent } from "./audit";

describe("recordAudit", () => {
  test("keeps the decision and drops tokens and secrets", () => {
    const sink: AuditEvent[] = [];
    const sessionToken = "session-token-should-not-leak";

    recordAudit(sink, {
      action: "memberProcedure",
      actorId: null,
      outcome: "unauthorized",
      token: sessionToken,
      accessToken: "access-token",
      refreshToken: "refresh-token",
      idToken: "id-token",
      password: "password",
      BETTER_AUTH_SECRET: "better-auth-secret",
    });
    recordAudit(sink, {
      action: "memberProcedure",
      actorId: "user-1",
      outcome: "forbidden",
      token: sessionToken,
    });
    recordAudit(sink, {
      action: "adminProcedure",
      actorId: "admin-1",
      outcome: "success",
      cookie: "session=secret",
    });

    expect(sink).toEqual([
      { action: "memberProcedure", actorId: null, outcome: "unauthorized" },
      { action: "memberProcedure", actorId: "user-1", outcome: "forbidden" },
      { action: "adminProcedure", actorId: "admin-1", outcome: "success" },
    ]);

    const serialized = JSON.stringify(sink);
    expect(serialized).not.toContain(sessionToken);
    expect(serialized).not.toContain("access-token");
    expect(serialized).not.toContain("refresh-token");
    expect(serialized).not.toContain("id-token");
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("better-auth-secret");
    expect(serialized).not.toContain("session=secret");
  });
});
