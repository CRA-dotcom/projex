import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Check for overdue assignments every day at 8am CST (14:00 UTC)
crons.daily(
  "overdue-check",
  { hourUTC: 14, minuteUTC: 0 },
  internal.functions.cron.overdueCheck.run,
  {}
);

// Monthly projection review on the 1st of each month at 8am CST (14:00 UTC)
crons.monthly(
  "monthly-review",
  { day: 1, hourUTC: 14, minuteUTC: 0 },
  internal.functions.cron.monthlyCheck.run,
  {}
);

export default crons;
