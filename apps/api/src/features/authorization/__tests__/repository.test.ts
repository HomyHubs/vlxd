import { Kysely, PostgresDialect } from "kysely";
import type { Pool } from "pg";
import { afterEach, describe, expect, it } from "vitest";
import type { Database } from "../../../platform/db/index.js";
import { KyselyAuthorizationRepository } from "../index.js";

describe("KyselyAuthorizationRepository", () => {
  let db: Kysely<Database> | undefined;

  afterEach(async () => {
    await db?.destroy();
  });

  it("does not resolve permissions from archived role groups", async () => {
    const queries: string[] = [];
    const client = {
      query: async (sql: string) => {
        queries.push(sql);
        return { rows: [{ code: "product.item.read" }] };
      },
      release: () => undefined,
    };
    const pool = {
      connect: async () => client,
      end: async () => undefined,
    };

    db = new Kysely<Database>({
      dialect: new PostgresDialect({ pool: pool as unknown as Pool }),
    });

    await new KyselyAuthorizationRepository(db).findRolePermissionCodes("user-1", "tenant-1");

    expect(queries[0]).toContain('"role_groups"."archived_at" is null');
  });
});
