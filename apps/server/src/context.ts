import type { Context as ApiContext } from "@whatsapp-crm/api/context";
import { parseAccessPolicy } from "@whatsapp-crm/auth/access";
import type { Context as HonoContext } from "hono";

import { auth, db } from "./services";
import { ENV } from "./env.server";

export type CreateContextOptions = {
  context: HonoContext;
};

function clientIp(header: string | undefined): string | null {
  if (!header) return null;
  const hop = header.split(",")[0]?.trim() ?? "";
  return hop.length > 0 ? hop : null;
}

export async function createContext({ context }: CreateContextOptions): Promise<ApiContext> {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });
  const requestId = context.req.header("x-request-id") || crypto.randomUUID();
  return {
    db,
    session,
    policy: parseAccessPolicy(ENV),
    request: {
      ip: clientIp(context.req.header("x-forwarded-for")),
      requestId,
    },
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
