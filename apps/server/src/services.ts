import { createAuth } from "@whatsapp-crm/auth";
import { createDb } from "@whatsapp-crm/db";

import { ENV } from "./env.server";

export const db = createDb(ENV);
export const auth = createAuth(ENV, db);
