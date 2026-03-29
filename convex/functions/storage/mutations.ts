import { mutation } from "../../_generated/server";
import { requireAuth } from "../../lib/authHelpers";

/**
 * Generates a short-lived upload URL for Convex Storage.
 * The client uses this URL to upload a file via fetch, then
 * receives a storageId to reference the stored file.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
