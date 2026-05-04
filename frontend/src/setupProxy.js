const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Dev-only: CRA loads this before other dev-server middleware.
 * Proxies same-origin /guide-api/* → copilot host (avoids browser CORS).
 */
module.exports = function setupProxy(app) {
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
