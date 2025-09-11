## HOW TO TALK TO MONGO (MCP)

This guide documents the exact, repeatable way to interact with our MongoDB Atlas database using the MongoDB MCP tools. Follow this SOP to avoid breaking access, creating stray Atlas users, or failing due to permissions.

### Principles
- Use the existing MCP Mongo session configured for this project. Do NOT create new Atlas users or modify the IP access list.
- Always connect with the full connection string that already includes the database name (e.g., `/chopped`). Do NOT connect by cluster name or SRV record.
- Prefer read-only inspection first; run minimal, idempotent writes only after confirming targets.
- Never commit secrets. The connection string is configured in MCP settings, not in the repo.

### Connect
- Use the MongoDB MCP server that is already set up for this project.
- Important: Do not pass a cluster name or SRV URL. Always pass the full, non-SRV connection string that includes the database path.

Example (conceptual; do not paste secrets):
```json
functions.mcp_MongoDB-Admin_connect
{
  "connectionStringOrClusterName": "<FULL_NONSrv_CONNECTION_STRING_WITH_/chopped>"
}
```

Notes:
- If you see `Connecting via cluster name not supported`, you passed a cluster name. Re-run with the full connection string.
- If you see `querySrv ETIMEOUT`, you used an SRV URL. Switch to the non-SRV connection string (with shard hosts, replicaSet, ssl, authSource, and `/chopped`).
- You do not need to list databases. The database is specified in the URI; operate directly on it.

### Common Read Operations
- Find the two oldest users (prefers `createdAt`, falls back to `_id`)
```json
functions.mcp_MongoDB-Admin_aggregate
{
  "database": "chopped",
  "collection": "users",
  "pipeline": [
    { "$sort": { "createdAt": 1, "_id": 1 } },
    { "$limit": 2 },
    { "$project": { "_id": 1, "createdAt": 1, "supabaseUserId": 1 } }
  ],
  "limit": 10
}
```

- Verify specific fields on one user (slice the last entry of arrays)
```json
functions.mcp_MongoDB-Admin_find
{
  "database": "chopped",
  "collection": "users",
  "filter": { "supabaseUserId": "<SUPABASE_USER_ID>" },
  "projection": { "gifts_sent": { "$slice": -1 }, "gifts_got": { "$slice": -1 }, "updatedAt": 1 },
  "limit": 1
}
```

Tip: Avoid filtering by `_id` using `{"$oid": "..."}` — the MCP API may reject `$oid`. Prefer filtering by `supabaseUserId` or other string keys. If you must use `_id`, run an aggregate to fetch the `_id`, then reuse the same filter style used in that aggregate in subsequent operations.

### Common Write Operations (Idempotent)
- Initialize gifts arrays if missing (safe, additive)
```json
functions.mcp_MongoDB-Admin_update-many
{
  "database": "chopped",
  "collection": "users",
  "filter": { "gifts_got": { "$exists": false } },
  "update": { "$set": { "gifts_got": [] } }
}
```
```json
functions.mcp_MongoDB-Admin_update-many
{
  "database": "chopped",
  "collection": "users",
  "filter": { "gifts_sent": { "$exists": false } },
  "update": { "$set": { "gifts_sent": [] } }
}
```

- Seed the oldest user with one gift entry in both arrays (example)
  - Use `supabaseUserId` to target the user.
  - Use `$currentDate` for `updatedAt`.
  - Provide `createdAt` as an ISO string for the new entries.
```json
functions.mcp_MongoDB-Admin_update-one
{
  "database": "chopped",
  "collection": "users",
  "filter": { "supabaseUserId": "<OLDEST_SUPABASE_USER_ID>" },
  "update": {
    "$push": {
      "gifts_sent": {
        "recipientUserId": "<SECOND_OLDEST_MONGO_ID>",
        "stripeTransactionId": null,
        "createdAt": "<ISO_DATE>",
        "amountCents": 500,
        "withdrawn": false,
        "withdrawnAt": null,
        "giftProvider": "stripe",
        "withdrawTransactionId": null
      },
      "gifts_got": {
        "senderUserId": "<SECOND_OLDEST_MONGO_ID>",
        "stripeTransactionId": null,
        "createdAt": "<ISO_DATE>",
        "amountCents": 500,
        "withdrawn": false,
        "withdrawnAt": null,
        "giftProvider": "stripe",
        "withdrawTransactionId": null
      }
    },
    "$currentDate": { "updatedAt": true }
  }
}
```

### Field Conventions
- Currency: store as integer cents in `amountCents`.
- Provider: set `giftProvider` to `"stripe"` for now.
- Dates: set `updatedAt` using `$currentDate`; set `createdAt` explicitly via ISO.
- IDs: `senderUserId` / `recipientUserId` are Mongo user IDs stored as strings here; if you need true `ObjectId`, fetch/confirm them first and use a supported filter strategy.

### Troubleshooting
- Unauthorized on `admin` (e.g., `listDatabases`): skip admin commands; operate on the DB from the URI (e.g., `chopped`).
- `unknown operator: $oid`: avoid `$oid` in filters/updates; prefer known string keys, e.g., `supabaseUserId`.
- SRV/cluster connect errors: use the full non-SRV connection string. Do not pass a cluster name.
- Do not rotate credentials or add IPs. If something fails, re-check you are using the preconfigured connection string.

### Safety Checklist (before any write)
1) Connected with the correct non-SRV connection string that includes `/chopped`.
2) Ran read-only queries to identify exact targets.
3) Prepared idempotent updates (`$set` with `$exists` checks, `$push` scoped to a single user).
4) Will verify via a narrow projection (`$slice`) after write.

### Audit Pattern
- Paste the exact MCP operation JSON in PRs/chats for approval before executing.
- Keep changes minimal and reversible.


