export type Role = "admin" | "member";

export type AccessPolicy = {
  allowedEmails: readonly string[];
  allowedDomain: string | null;
  adminEmails: readonly string[];
};

export type AccessSubject = {
  userId: string;
  email: string;
  emailVerified: boolean;
  role: Role;
} | null;

export type AccessDecision = "ok" | "unauthorized" | "forbidden";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => normalizeEmail(part))
    .filter((part) => part.length > 0);
}

export function parseAccessPolicy(env: {
  AUTH_ALLOWED_EMAILS?: string;
  AUTH_ALLOWED_DOMAIN?: string;
  AUTH_ADMIN_EMAILS?: string;
}): AccessPolicy {
  const domain = env.AUTH_ALLOWED_DOMAIN?.trim().toLowerCase().replace(/^@/, "") ?? "";
  return {
    allowedEmails: parseList(env.AUTH_ALLOWED_EMAILS),
    allowedDomain: domain.length > 0 ? domain : null,
    adminEmails: parseList(env.AUTH_ADMIN_EMAILS),
  };
}

export function assertAccessPolicy(policy: AccessPolicy): void {
  if (policy.allowedEmails.length === 0 && policy.allowedDomain === null) {
    throw new Error("Set AUTH_ALLOWED_EMAILS or AUTH_ALLOWED_DOMAIN before starting auth");
  }
}

export function isEmailAllowed(email: string, policy: AccessPolicy): boolean {
  const normalized = normalizeEmail(email);
  if (normalized.length === 0) return false;
  if (policy.allowedEmails.includes(normalized)) return true;
  if (policy.allowedDomain && normalized.endsWith(`@${policy.allowedDomain}`)) return true;
  return false;
}

export function roleForEmail(email: string, policy: AccessPolicy): Role {
  return policy.adminEmails.includes(normalizeEmail(email)) ? "admin" : "member";
}

export function decideAccess(input: {
  subject: AccessSubject;
  policy: AccessPolicy;
  requiredRole: Role;
}): AccessDecision {
  const { subject, policy, requiredRole } = input;
  if (!subject) return "unauthorized";
  if (!subject.emailVerified || !isEmailAllowed(subject.email, policy)) return "forbidden";
  if (requiredRole === "admin" && subject.role !== "admin") return "forbidden";
  return "ok";
}

export function subjectFromUser(
  user:
    | {
        id: string;
        email: string;
        emailVerified: boolean;
        role?: string | null;
      }
    | null
    | undefined,
): AccessSubject {
  if (!user) return null;
  return {
    userId: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role === "admin" ? "admin" : "member",
  };
}
