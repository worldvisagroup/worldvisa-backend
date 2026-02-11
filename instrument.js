const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://f583f85b69cca52dacdc5dce6a28d1b3@o4509989875744768.ingest.de.sentry.io/4510866460573776",
  sendDefaultPii: true,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  tracesSampler: ({ name }) => {
    const lower = (name || "").toLowerCase();
    if (lower.includes("auth") || lower.includes("login") || lower.includes("logout") || lower.includes("signup")) {
      return 1.0;
    }
    return undefined;
  },

  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],

  beforeSendLog: (log) => {
    if (log && log.attributes) {
      const safe = { ...log.attributes };
      const redactKeys = ["password", "token", "csrfToken", "sessionId", "cookie", "authorization"];
      for (const key of Object.keys(safe)) {
        const lower = key.toLowerCase();
        if (redactKeys.some((r) => lower.includes(r))) {
          delete safe[key];
        }
      }
      return { ...log, attributes: safe };
    }
    return log;
  },
});