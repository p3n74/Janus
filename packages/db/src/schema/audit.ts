import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  actorId: text("actor_id"),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  target: text("target"),
  outcome: text("outcome").notNull(),
  reason: text("reason"),
  metadata: jsonb("metadata").$type<{ procedure?: string }>(),
  ip: text("ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
