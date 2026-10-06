import type { Session } from "@whatsapp-crm/auth";
import type { Database } from "@whatsapp-crm/db";

export type Context = {
  session: Session | null;
  db: Database;
};
