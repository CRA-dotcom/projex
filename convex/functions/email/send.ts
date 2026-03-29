import { action } from "../../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    from: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set, skipping email");
      return { sent: false, reason: "no_api_key" };
    }

    const resend = new Resend(apiKey);
    const from = args.from ?? "Projex <noreply@projex-platform.com>";

    try {
      const { data, error } = await resend.emails.send({
        from,
        to: args.to,
        subject: args.subject,
        html: args.html,
      });

      if (error) {
        console.error("Email send error:", error);
        return { sent: false, reason: error.message };
      }

      return { sent: true, id: data?.id };
    } catch (err) {
      console.error("Email send exception:", err);
      return { sent: false, reason: String(err) };
    }
  },
});
