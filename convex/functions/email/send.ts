import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

async function sendEmailHandler(args: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
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
}

const emailArgs = {
  to: v.string(),
  subject: v.string(),
  html: v.string(),
  from: v.optional(v.string()),
};

// Internal action for use with ctx.scheduler.runAfter
export const sendEmailInternal = internalAction({
  args: emailArgs,
  handler: async (_ctx, args) => {
    return await sendEmailHandler(args);
  },
});

// Public action for direct client calls
export const sendEmail = action({
  args: emailArgs,
  handler: async (_ctx, args) => {
    return await sendEmailHandler(args);
  },
});
