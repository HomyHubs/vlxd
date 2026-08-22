import { buildApp } from "./app.js";
import { loadConfig } from "./platform/config.js";

async function main() {
  const config = loadConfig();
  const app = buildApp(config);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Received shutdown signal, closing server...");
    try {
      await app.close();
      app.log.info("Server gracefully closed");
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  try {
    const address = await app.listen({
      port: config.PORT,
      host: config.HOST,
    });
    app.log.info({ address, env: config.NODE_ENV }, "Server listening");
  } catch (err) {
    app.log.fatal({ err }, "Failed to start server");
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
