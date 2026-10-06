export type AuditEvent = {
  action: string;
  actorId: string | null;
  outcome: "success" | "unauthorized" | "forbidden";
};

export function recordAudit(sink: AuditEvent[], event: AuditEvent & Record<string, unknown>): void {
  sink.push({
    action: event.action,
    actorId: event.actorId,
    outcome: event.outcome,
  });
}
