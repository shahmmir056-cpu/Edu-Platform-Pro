import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { setupSocketServer } from "./lib/socket";

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

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception");
});
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "Unhandled rejection");
});

const httpServer = createServer(app);
setupSocketServer(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "API server started");

  logger.info({ port }, "Server listening with WebSocket support");
});
