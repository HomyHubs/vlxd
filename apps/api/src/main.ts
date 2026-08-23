import type { Kysely } from "kysely";
import { buildApp } from "./app.js";
import { loadConfig } from "./platform/config.js";
import { closeDatabase, createDatabase, type Database } from "./platform/db/index.js";

async function main() {
  let db: Kysely<Database> | undefined;

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    process.stderr.write(`Startup fatal error: Failed to load configuration\n${String(err)}\n`);
    process.exit(1);
  }

  if (config.DATABASE_URL) {
    try {
      db = createDatabase(config);
    } catch (err) {
      process.stderr.write(
        `Startup fatal error: Failed to initialize database pool\n${String(err)}\n`,
      );
      process.exit(1);
    }
  }

  const app = buildApp({ config, db });

  let isShuttingDown = false;
  const shutdown = async (signal: string, exitCode = 0) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    app.log.info({ signal }, "Received shutdown signal, closing server gracefully...");
    try {
      await app.close();
      app.log.info("Fastify server closed");

      if (db) {
        await closeDatabase(db);
        app.log.info("Database connection pool closed");
      }

      app.log.info("Graceful shutdown completed successfully");
      process.exit(exitCode);
    } catch (err) {
      app.log.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT", 0));
  process.on("SIGTERM", () => shutdown("SIGTERM", 0));

  process.on("uncaughtException", (err) => {
    app.log.fatal({ err }, "Uncaught exception encountered");
    shutdown("uncaughtException", 1);
  });

  process.on("unhandledRejection", (reason) => {
    app.log.fatal({ reason }, "Unhandled promise rejection encountered");
    shutdown("unhandledRejection", 1);
  });

  try {
    const address = await app.listen({
      port: config.PORT,
      host: config.HOST,
    });
    app.log.info(
      {
        address,
        env: config.NODE_ENV,
        database: Boolean(config.DATABASE_URL),
      },
      "VLXD API server listening and ready",
    );
  } catch (err) {
    app.log.fatal({ err }, "Failed to start VLXD API server");
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
