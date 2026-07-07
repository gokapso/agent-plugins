---
name: observe-whatsapp
description: "Observe and troubleshoot WhatsApp in Kapso: search operational logs, debug message delivery, inspect webhook deliveries/retries, triage API errors, and run health checks. Use when investigating production issues, message failures, API calls, workflow execution issues, or webhook delivery problems."
---

# Observe WhatsApp

## When to use

Use this skill for operational diagnostics: unified project log search, message delivery investigation, webhook delivery debugging, error triage, workflow execution investigation, and WhatsApp health checks.

## Setup

Preferred path:
- Kapso CLI installed and authenticated (`kapso login`)
- Start with `kapso status` to confirm project access and available WhatsApp numbers

Fallback path:
Env vars:
- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`)
- `KAPSO_API_KEY`

## How to

### Investigate message delivery

Preferred path:
1. Resolve the number: `kapso whatsapp numbers resolve --phone-number "<display-number>" --output json`
2. List recent messages: `kapso whatsapp messages list --phone-number "<display-number>" --limit 50 --output json`
3. Inspect a specific message: `kapso whatsapp messages get <message-id> --phone-number-id <id> --output json`
4. Inspect the conversation: `kapso whatsapp conversations list --phone-number "<display-number>" --output json`

Fallback path:
1. List messages: `node scripts/messages.js --phone-number-id <id>`
2. Inspect message: `node scripts/message-details.js --message-id <id>`
3. Find conversation: `node scripts/lookup-conversation.js --phone-number <e164>`

### Triage errors

Preferred path:
1. Search cross-source logs first when you have a request ID, `wamid.*`, endpoint, webhook ID, workflow execution ID, phone number, or recent time window:
   `kapso logs search --query "<identifier-or-text>" --period 24h --limit 20 --output json`
2. Narrow by source when known:
   `kapso logs search --source external_api_log --query "/messages" --problems-only --output json`
3. Confirm project and number state: `kapso status`
4. Run number health: `kapso whatsapp numbers health --phone-number "<display-number>" --output human`
5. Inspect related templates when relevant: `kapso whatsapp templates list --phone-number "<display-number>" --output json`

MCP path:
- If the Kapso MCP server is connected, use `search_logs` for cross-resource diagnostics before older narrow tools.
- Good starting inputs: `query`, `period`, `source`, `problems_only`, `limit`, and `filters` as `{key, value}` entries.
- Sources: `external_api_log`, `whatsapp_webhook_event`, `flow_event`, `webhook_delivery`.

Fallback path:
1. Unified log search: `node scripts/log-search.js --query "<identifier-or-text>" --period 24h --limit 20`
2. Discover log-search filters and sources: `node scripts/log-search-catalog.js`
3. Message errors: `node scripts/errors.js`
4. API logs: `node scripts/api-logs.js`
5. Webhook deliveries: `node scripts/webhook-deliveries.js`

Use direct API filters when you know the indexed field:
```bash
node scripts/log-search.js --source api --problems-only true --filter response_status=500 --filter endpoint_contains=/messages
node scripts/log-search.js --source workflows --filter flow_execution_id=exec_123 --limit 20
```

### Run health checks

Preferred path:
1. Project overview: `kapso status`
2. Phone number health: `kapso whatsapp numbers health --phone-number "<display-number>" --output human`

Fallback path:
1. Project overview: `node scripts/overview.js`
2. Phone number health: `node scripts/whatsapp-health.js --phone-number-id <id>`

## Scripts

### Messages

| Script | Purpose |
|--------|---------|
| `messages.js` | List messages |
| `message-details.js` | Get message details |
| `lookup-conversation.js` | Find conversation by phone or ID |

### Errors and logs

| Script | Purpose |
|--------|---------|
| `log-search.js` | Search unified Logs V2 events across API, Meta, workflows, and webhook deliveries |
| `log-search-catalog.js` | List log-search sources, filters, and detail fields |
| `errors.js` | List message errors |
| `api-logs.js` | List external API logs |
| `webhook-deliveries.js` | List webhook delivery attempts |

### Health

| Script | Purpose |
|--------|---------|
| `overview.js` | Project overview |
| `whatsapp-health.js` | Phone number health check |

### OpenAPI

| Script | Purpose |
|--------|---------|
| `openapi-explore.mjs` | Explore OpenAPI (search/op/schema/where) |

Install deps (once):
```bash
npm i
```

Examples:
```bash
node scripts/openapi-explore.mjs --spec platform search "log search"
node scripts/openapi-explore.mjs --spec platform op searchLogs
node scripts/openapi-explore.mjs --spec platform op getLogSearchCatalog
```

## Notes

- For webhook setup (create/update/delete, signature verification, event types), use `integrate-whatsapp`.
- Prefer resolving a display phone number to the canonical `phone_number_id` before deep debugging.
- Prefer unified log search before older narrow tools when the user gives a request ID, WhatsApp `wamid.*`, endpoint, webhook ID, workflow execution ID, phone ID, conversation, or recent incident window.
- Keep the scripts as the fallback path when the CLI or MCP is unavailable.

## References

- [references/message-debugging-reference.md](references/message-debugging-reference.md) - Message debugging guide
- [references/log-search-reference.md](references/log-search-reference.md) - Unified log search guide
- [references/triage-reference.md](references/triage-reference.md) - Error triage guide
- [references/health-reference.md](references/health-reference.md) - Health check guide

## Related skills

- `integrate-whatsapp` - Onboarding, webhooks, messaging, templates, flows
- `automate-whatsapp` - Workflows, agents, and automations

<!-- FILEMAP:BEGIN -->
```text
[observe-whatsapp file map]|root: .
|.:{package.json,SKILL.md}
|assets:{health-example.json,message-debugging-example.json,triage-example.json}
|references:{health-reference.md,log-search-reference.md,message-debugging-reference.md,triage-reference.md}
|scripts:{api-logs.js,errors.js,log-search-catalog.js,log-search.js,lookup-conversation.js,message-details.js,messages.js,openapi-explore.mjs,overview.js,webhook-deliveries.js,whatsapp-health.js}
|scripts/lib/messages:{args.js,kapso-api.js}
|scripts/lib/status:{args.js,kapso-api.js}
|scripts/lib/triage:{args.js,kapso-api.js}
```
<!-- FILEMAP:END -->
