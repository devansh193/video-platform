import { db } from "@repo/db";
import { users } from "@repo/db/schema";
import { auth } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import superjson from "superjson";

export const createTRPCContext = cache(async () => {
  const { userId } = await auth();
  return { clerkUserId: userId };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    const { ctx } = opts;
    if (!ctx.clerkUserId) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, ctx.clerkUserId))
      .limit(1);
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next({
      ctx: {
        ...ctx,
        user,
      },
    });
  }
);
