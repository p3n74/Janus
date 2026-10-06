import type { Session } from "@whatsapp-crm/auth";
import type { AccessPolicy } from "@whatsapp-crm/auth/access";
import type { Database } from "@whatsapp-crm/db";

export type RequestMeta = {
  ip: string | null;
  requestId: string;
};

export type Context = {
  session: Session | null;
  db: Database;
  policy: AccessPolicy;
  request: RequestMeta;
};
