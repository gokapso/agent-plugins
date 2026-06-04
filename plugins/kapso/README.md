# Kapso

## Description

Kapso is the WhatsApp API for developers. This plugin helps agents build, integrate, and observe WhatsApp automations through Kapso skills, helper scripts, examples, and a remote MCP connection.

## Features

- Connect WhatsApp to products with setup links, connection detection, webhooks, sends, templates, media, and WhatsApp Flows.
- Build Kapso workflows with WhatsApp triggers, AI steps, functions, app integrations, data tables, and execution controls.
- Observe production issues by inspecting message delivery, webhook retries, API logs, template health, number health, and error patterns.
- Use bundled examples and references so agents can act with product-specific context instead of generic WhatsApp guidance.
- Keep risky operations behind explicit user approval for sends, deploys, deletes, webhook changes, template creation, setup links, and workflow mutations.

## Prerequisites

- A Kapso account with access to the project or customer you want to operate.
- Node.js 20+ for the bundled helper scripts.
- Optional: Kapso CLI installed and authenticated.

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

Codex users can authenticate the MCP server with:

```bash
codex mcp login kapso
```

## Examples

### Onboard a Customer to WhatsApp

User prompt: "Create a setup link for this customer and tell me how to detect when they finish connecting WhatsApp."

Expected behavior:

- The agent uses the `integrate-whatsapp` skill.
- It checks for a customer record or creates one when appropriate.
- It generates a setup link, explains redirect handling, and points to webhook or API-based connection detection.

### Build a WhatsApp Support Workflow

User prompt: "Build a WhatsApp support intake workflow that asks for order ID, classifies the issue, and routes urgent cases."

Expected behavior:

- The agent uses the `automate-whatsapp` skill.
- It drafts or updates a workflow graph with WhatsApp trigger, wait, decide, function, and agent nodes.
- It validates the graph before suggesting deployment.

### Debug a Failed Message

User prompt: "Why did this WhatsApp message fail, and did the webhook retry?"

Expected behavior:

- The agent uses the `observe-whatsapp` skill.
- It gathers message details, delivery history, API errors, webhook deliveries, and number health.
- It returns a concise diagnosis with next actions and escalation paths.

## Safety

Read-only inspection and local validation are safe defaults. Real sends, flow publishes, deletes, webhook updates, template creates, function deploys, trigger changes, and customer/setup-link writes require explicit user approval.

The helper scripts reject localhost and plain HTTP API base URLs by default so API keys are not accidentally sent to an unintended endpoint. Use `KAPSO_API_ALLOW_LOCALHOST=true` only for trusted local development, and `KAPSO_API_ALLOW_INSECURE_HTTP=true` only for trusted development hosts.

## Privacy Policy

See: https://kapso.ai/privacy

## Support

- Documentation: https://docs.kapso.ai
- Issues and plugin requests: https://github.com/gokapso/agent-plugins/issues
