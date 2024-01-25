const envVars = [
    "NODE_ENV",
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "DATABASE_URL",
    "NODEMAILER_EMAIL",
    "NODEMAILER_PASSWORD",
  ] as const;
  
  const config = envVars.reduce(
    (prev, curr) => ({ ...prev, [curr]: process.env[curr] }),
    {}
  );
  
  Object.entries(config).forEach(([key, val]) => {
    if (!val) {
      throw new Error(`Cannot parse environment variable: ${key} is not set.`);
    }
  });
  
  export default config as {
    [key in (typeof envVars)[number]]: NonNullable<(typeof process.env)[key]>;
  };