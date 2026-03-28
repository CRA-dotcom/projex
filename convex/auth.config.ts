const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN ?? "https://cute-minnow-34.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default authConfig;
