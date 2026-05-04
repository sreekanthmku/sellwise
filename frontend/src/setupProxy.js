const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Dev-only: CRA loads this before other dev-server middleware.
 * Proxies same-origin /guide-api/* → copilot host (avoids browser CORS).
 */
module.exports = function setupProxy(app) {
  /**
   * Vobiz Nimbus log upload: npm build leaves LOG_COLLECTION as "", so `fetch` uses the
   * current document URL (e.g. /leads/h1/call). CRA has no route → 404 → SDK rejects with
   * Uncaught (in promise) Error: failure. Respond 200 so o.ok is true in the SDK.
   * Production: configure a real log endpoint or the same absorb rules on your static host.
   */
  app.use((req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }
    const pathOnly = String(req.originalUrl || req.url || "").split("?")[0];
    if (pathOnly.startsWith("/guide-api")) {
      next();
      return;
    }
    const absorbNimbusPost =
      pathOnly === "/" ||
      pathOnly === "/calling-setup" ||
      pathOnly.startsWith("/calling-setup/") ||
      pathOnly === "/leads" ||
      pathOnly.startsWith("/leads/") ||
      pathOnly === "/perform" ||
      pathOnly.startsWith("/perform/") ||
      pathOnly === "/guide" ||
      pathOnly.startsWith("/guide/");
    if (absorbNimbusPost) {
      res.status(200).type("application/json").send("{}");
      return;
    }
    next();
  });

  app.use(
    "/guide-api",
    createProxyMiddleware({
      target: "http://146.190.14.175",
      changeOrigin: true,
      pathRewrite: { "^/guide-api": "" },
      secure: false,
      logLevel: "silent",
    }),
  );
};
