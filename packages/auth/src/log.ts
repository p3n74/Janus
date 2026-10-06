export type AccessLog = {
  decision: "allow" | "deny";
  reason: "ok" | "unauthenticated" | "forbidden";
  action: string;
  target: string | null;
  actorId: string | null;
  actorEmail: string | null;
  ip: string | null;
  requestId: string | null;
};

export function logAccess(entry: AccessLog): void {
  const line = {
    ts: new Date().toISOString(),
    level: entry.decision === "deny" ? "warn" : "info",
    event: "access",
    decision: entry.decision,
    reason: entry.reason,
    action: entry.action,
    target: entry.target,
    actorId: entry.actorId,
    actorEmail: entry.actorEmail,
    ip: entry.ip,
    requestId: entry.requestId,
  };
  console.log(JSON.stringify(line));
}

export function logAuditFailure(action: string, requestId: string | null): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      event: "audit_write_failed",
      action,
      requestId,
    }),
  );
}
