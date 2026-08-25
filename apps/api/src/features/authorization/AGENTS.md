# Authorization feature

TASK-011a owns server-side capability evaluation and the reusable Fastify permission guard.

- Permission checks use capability codes, never business titles.
- Role-group permissions and tenant-level custom overrides are evaluated from the database.
- Any `DENY` override wins over every `ALLOW`.
- Scope-aware overrides (`BRANCH`, `WAREHOUSE`, `OWN_RECORDS`, `ASSIGNED_RECORDS`) belong to TASK-011c.
- Routes import this feature only through `index.ts`.
