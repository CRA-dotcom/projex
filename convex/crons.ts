import { cronJobs } from "convex/server";

const crons = cronJobs();

// DISABLED: Enable when ready for production notifications
// import { internal } from "./_generated/api";
//
// crons.daily(
//   "overdue-check",
//   { hourUTC: 14, minuteUTC: 0 },
//   internal.functions.cron.overdueCheck.run,
//   {}
// );
//
// crons.monthly(
//   "monthly-review",
//   { day: 1, hourUTC: 14, minuteUTC: 0 },
//   internal.functions.cron.monthlyCheck.run,
//   {}
// );

export default crons;
