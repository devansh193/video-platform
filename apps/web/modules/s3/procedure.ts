import { db } from "@repo/db";
import { videos } from "@repo/db/schema";
import { s3Driver } from "@repo/services/s3/s3.config";
import { createTRPCRouter, protectedProcedure } from "../../trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const s3Router = createTRPCRouter({
  getPreSignedUrl: protectedProcedure
    .input(
      z.object({
        mimeType: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx?.user.id;
        if (!userId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Used ID is missing in context",
          });
        }
        console.log("Generating presigned usl.....");
        const { fileName, mimeType } = input;
        const id = Math.random();
        const s3Key = `${id}${fileName}`;
        const [s3UploadData, video] = await Promise.all([
          s3Driver.getUrlToUpload({ key: s3Key, mimeType }, "raw-video"),
          db
            .insert(videos)
            .values({
              userId,
              title: "This is title",
              description: "This is description",
              s3key: s3Key,
            })
            .returning(),
        ]);
        return {
          preSignedUrl: s3UploadData.url,
          path: s3UploadData.path,
          videoId: video[0]?.id,
        };
      } catch (_error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Error creating a presigned URL ${_error}`,
        });
      }
    }),
});
