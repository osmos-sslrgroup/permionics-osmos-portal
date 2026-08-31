import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Keep Render backend awake by self-pinging every 10 minutes
  const PUBLIC_URL = "https://permionics-insights-hub.onrender.com/api/healthz";
  setInterval(() => {
    fetch(PUBLIC_URL)
      .then((res) => {
        logger.info({ status: res.status }, "keep-alive: Self-ping successful");
      })
      .catch((err) => {
        logger.warn({ err: err.message }, "keep-alive: Self-ping failed");
      });
  }, 600000); // 10 minutes
});
