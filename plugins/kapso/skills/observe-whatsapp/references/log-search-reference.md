# Unified Log Search

Use unified log search before narrow list endpoints when the user gives an identifier or incident window. It searches project-scoped API calls, Meta webhook events, WhatsApp message events, workflow events, function invocations/logs, and outbound webhook deliveries.

## Surfaces

- CLI: `kapso logs search`
- MCP: `search_logs`
- Direct API fallback: `node scripts/log-search.js`
- Catalog fallback: `node scripts/log-search-catalog.js`

## Sources

- `external_api_log`: customer or backend calls into the Kapso Platform API
- `whatsapp_webhook_event`: raw Meta webhook event projections
- `whatsapp_message_event`: normalized WhatsApp message lifecycle events
- `function_invocation_event`: function invocations
- `function_log_event`: runtime function logs
- `functions`: direct API group covering both function sources
- `flow_event`: workflow execution and step events
- `webhook_delivery`: Kapso webhook attempts to customer endpoints

Aliases in the fallback script:
- `api` -> `external_api_log`
- `meta` -> `whatsapp_webhook_event`
- `messages` -> `whatsapp_message_event`
- `functions` -> both function sources (direct API)
- `workflows` -> `flow_event`
- `webhooks` -> `webhook_delivery`

The bundled CLI currently accepts the original API, Meta, workflow, and webhook sources. Use MCP or the direct API for newer message and function sources; consult the catalog and connected schema for deployed availability.

## Good Starting Searches

Request or trace ID:
```bash
kapso logs search --query "req_123" --period 24h --limit 20 --output json
```

WhatsApp message ID:
```bash
kapso logs search --query "wamid.ABC123" --period 7d --output json
```

Failed API sends:
```bash
kapso logs search --source external_api_log --query "/messages" --problems-only --filter response_status=500 --output json
```

Workflow execution:
```bash
kapso logs search --source flow_event --filter flow_execution_id=exec_123 --limit 20 --output json
```

Direct API fallback:
```bash
node scripts/log-search.js --query "wamid.ABC123" --period 24h --limit 10
node scripts/log-search.js --source webhooks --problems-only true --filter webhook_id=wh_123
```

## Filters

Use `node scripts/log-search-catalog.js` to discover available filter keys. Common useful filters include:

- `request_id`
- `response_status`
- `endpoint_contains`
- `whatsapp_message_id`
- `phone_number_id`
- `flow_execution_id`
- `event_type`
- `webhook_id`
- `status`
- `has_status_error`

Use filters only when you know the indexed field. Start with `query` when the identifier could appear in multiple sources.

## Context Windows

For event context around a timestamp, use the direct API fallback:
```bash
node scripts/log-search.js --period context --around "2026-07-07T12:00:00Z" --highlight-resource-id msg_123 --limit 30
```

Use `pagination.next_cursor` from a previous response with:
```bash
node scripts/log-search.js --cursor "<next_cursor>" --limit 50
```

## MCP response handling

MCP `search_logs` accepts `cursor`, periods `24h`, `7d`, or `30d`, and at most 20 results. Discover supported sources and filters from the connected tool schema; deployed versions can differ from the direct API catalog. Set `problems_only: false` when reconstructing a complete timeline. An `available: false` response means search failed, not that the project has no matching events. Report the limitation and use a narrower inspection surface when available.
