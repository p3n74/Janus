import type { AccessDecision, AccessPolicy, Role } from "@whatsapp-crm/auth/access";
import { decideAccess, subjectFromUser } from "@whatsapp-crm/auth/access";
import { logAccess, logAuditFailure } from "@whatsapp-crm/auth/log";
import { auditLog } from "@whatsapp-crm/db/schema/audit";
import { initTRPC, TRPCError } from "@trpc/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create();

export const router = t.router;

export const publicProcedure = t.procedure;

function reasonFor(decision: AccessDecision): "ok" | "unauthenticated" | "forbidden" {
  if (decision === "ok") return "ok";
  if (decision === "unauthorized") return "unauthenticated";
  return "forbidden";
}

const enforce = (requiredRole: Role) =>
  t.procedure.use(async ({ ctx, next, path }) => {
    const subject = subjectFromUser(ctx.session?.user);
    const decision = decideAccess({
      subject,
      policy: ctx.policy,
      requiredRole,
    });
    const action = `trpc.${path}`;
    logAccess({
      decision: decision === "ok" ? "allow" : "deny",
      reason: reasonFor(decision),
      action,
      target: path,
      actorId: subject?.userId ?? null,
      actorEmail: subject?.email ?? null,
      ip: ctx.request.ip,
      requestId: ctx.request.requestId,
    });

    const insert = ctx.db?.insert?.bind(ctx.db);
    if (insert) {
      try {
        await insert(auditLog).values({
          id: crypto.randomUUID(),
          actorId: subject?.userId ?? null,
          actorEmail: subject?.email ?? null,
          action,
          target: path,
          outcome: decision === "ok" ? "allow" : "deny",
          reason: reasonFor(decision),
          metadata: { procedure: path },
          ip: ctx.request.ip,
        });
      } catch {
        logAuditFailure(action, ctx.request.requestId);
      }
    }

    if (decision === "unauthorized") {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }
    if (decision !== "ok" || !ctx.session) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "This account is not allowed",
      });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    });
  });

export const protectedProcedure = enforce("member");
export const memberProcedure = protectedProcedure;
export const adminProcedure = enforce("admin");

export type { AccessPolicy };
