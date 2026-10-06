import { adminProcedure, protectedProcedure, publicProcedure, router } from "../index";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  adminCheck: adminProcedure.query(() => {
    return { ok: true as const };
  }),
});
export type AppRouter = typeof appRouter;
