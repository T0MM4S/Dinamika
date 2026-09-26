import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getLiveTelemetry, runDiagnostic } from "./services/wanTelemetry";
import { getTelemetryHistory } from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  lab: router({
    snapshot: publicProcedure.query(() => getLiveTelemetry()),
    history: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(240).default(120) }).optional()).query(async ({ input }) => {
      const rows = [...await getTelemetryHistory(input?.limit ?? 120)].reverse();
      const bgpChanges = rows.slice(1).reduce((count, row, index) => count + (row.bgpState !== rows[index]?.bgpState ? 1 : 0), 0);
      const ospfChanges = rows.slice(1).reduce((count, row, index) => count + (row.ospfState !== rows[index]?.ospfState ? 1 : 0), 0);
      return { rows, bgpChanges, ospfChanges };
    }),
    diagnostic: publicProcedure
      .input(z.object({ name: z.enum(["docker-status", "container-status", "bgp-summary", "bgp-routes", "ospf-neighbors", "ospf-routes", "route-table", "interface-status"]), node: z.enum(["isp-peer", "hq-r1", "br-r1"]).optional() }))
      .mutation(({ input }) => runDiagnostic(input.name, input.node)),
  }),
});

export type AppRouter = typeof appRouter;
