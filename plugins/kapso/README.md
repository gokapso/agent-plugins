# Kapso

Kapso helps agents build, integrate, and observe WhatsApp automations.

This plugin shares one set of skills across Codex, Cursor, and Claude Code:

- `integrate-whatsapp`: connect WhatsApp, setup links, webhooks, messages, templates, and flows.
- `automate-whatsapp`: build workflows, triggers, functions, agents, integrations, and database-backed automations.
- `observe-whatsapp`: inspect delivery, webhooks, API errors, templates, and number health.

## Prerequisites

- Node.js 20+
- Kapso CLI installed and authenticated:

```bash
npm install -g @kapso/cli
kapso login
```

For Codex MCP auth:

```bash
codex mcp login kapso
```

Project API keys remain useful for direct API fallback scripts:

```bash
export KAPSO_API_KEY="..."
export KAPSO_API_BASE_URL="https://api.kapso.ai"
```

## MCP

The bundled MCP config points to:

```text
https://api.kapso.ai/mcp
```

## Safety

Read-only inspection and local validation are safe defaults. Real sends, pushes, deletes, webhook updates, template creates, function deploys, trigger changes, and customer/setup-link writes require explicit user approval.
