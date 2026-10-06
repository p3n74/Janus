import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "@whatsapp-crm/api/routers/index";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { createContext } from "./context";
import { ENV } from "./env.server";
import { auth } from "./services";

const app = new Hono();

app.use("*", async (c, next) => {
  const started = Date.now();
  await next();
  const path = new URL(c.req.url).pathname;
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "info",
      event: "request",
      method: c.req.method,
      path,
      status: c.res.status,
      ms: Date.now() - started,
    }),
  );
});
app.use(
  "/*",
  cors({
    origin: ENV.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", async (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/trpc",
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.get("/", (c) => {
  return c.text("OK");
});

export default app;
