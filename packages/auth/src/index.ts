import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import type { Database } from "@whatsapp-crm/db";
import * as schema from "@whatsapp-crm/db/schema/auth";
import { user as userTable } from "@whatsapp-crm/db/schema/auth";
import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";

import {
  assertAccessPolicy,
  decideAccess,
  parseAccessPolicy,
  roleForEmail,
  subjectFromUser,
  type AccessPolicy,
} from "./access";
import { logAccess } from "./log";

export type AuthConfig = {
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  CORS_ORIGIN: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_ALLOWED_EMAILS?: string;
  AUTH_ALLOWED_DOMAIN?: string;
  AUTH_ADMIN_EMAILS?: string;
};

function deny(action: string, email: string | null): never {
  logAccess({
    decision: "deny",
    reason: "forbidden",
    action,
    target: action,
    actorId: null,
    actorEmail: email,
    ip: null,
    requestId: null,
  });
  throw new APIError("FORBIDDEN", {
    message: "This account is not allowed",
  });
}

export function createAuth(
  env: AuthConfig,
  database: Database,
  desktopOrigins: readonly string[] = [],
) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required");
  }

  const policy: AccessPolicy = parseAccessPolicy(env);
  assertAccessPolicy(policy);
  const allowedDomain = policy.allowedDomain;

  return betterAuth({
    database: drizzleAdapter(database, {
      provider: "pg",
      schema,
    }),
    trustedOrigins: [
      env.CORS_ORIGIN,
      ...desktopOrigins,
      "whatsapp-crm://",
      "exp://",
      "http://localhost:8081",
    ],
    emailAndPassword: { enabled: false },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        ...(allowedDomain ? { hd: allowedDomain } : {}),
      },
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "member",
          input: false,
        },
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const email = typeof user.email === "string" ? user.email : "";
            const subject = subjectFromUser({
              id: typeof user.id === "string" ? user.id : "pending",
              email,
              emailVerified: user.emailVerified === true,
              role: roleForEmail(email, policy),
            });
            if (decideAccess({ subject, policy, requiredRole: "member" }) !== "ok" || !subject) {
              deny("auth.user.create", email || null);
            }
            logAccess({
              decision: "allow",
              reason: "ok",
              action: "auth.user.create",
              target: "auth.user.create",
              actorId: subject.userId,
              actorEmail: subject.email,
              ip: null,
              requestId: null,
            });
            return {
              data: {
                ...user,
                role: subject.role,
              },
            };
          },
        },
      },
      session: {
        create: {
          before: async (session) => {
            const userId = typeof session.userId === "string" ? session.userId : "";
            const [row] = await database
              .select({
                id: userTable.id,
                email: userTable.email,
                emailVerified: userTable.emailVerified,
                role: userTable.role,
              })
              .from(userTable)
              .where(eq(userTable.id, userId))
              .limit(1);
            const subject = subjectFromUser(row);
            if (decideAccess({ subject, policy, requiredRole: "member" }) !== "ok" || !subject) {
              deny("auth.session.create", subject?.email ?? row?.email ?? null);
            }
            logAccess({
              decision: "allow",
              reason: "ok",
              action: "auth.session.create",
              target: "auth.session.create",
              actorId: subject.userId,
              actorEmail: subject.email,
              ip: null,
              requestId: null,
            });
            return { data: session };
          },
        },
      },
    },
    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [expo()],
  });
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];
