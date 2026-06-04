# Kapso Agent Plugins

Use Kapso with your favorite agent harness. These plugins give Codex, Cursor, and Claude Code focused skills for building, integrating, and operating WhatsApp agents on Kapso.

Missing an agent harness? Open an issue in this repository.

## What It Includes

- `integrate-whatsapp`: connect WhatsApp to products, onboard customers, configure webhooks, send messages, manage templates, and work with WhatsApp Flows.
- `automate-whatsapp`: build workflows, triggers, functions, agents, app integrations, and database-backed automations.
- `observe-whatsapp`: inspect delivery, webhook retries, API errors, number health, templates, and operational incidents.
- Kapso MCP server configs for remote authenticated access to Kapso.
- Safety guidance, examples, and validation scripts for release checks.

## Cursor

```text
/add-plugin kapso
```

For local testing from this repository:

```text
/add-plugin /path/to/kapso-agent-plugins
```

## Claude Code

Add the custom marketplace:

```text
/plugin marketplace add gokapso/agent-plugins
```

Install the plugin:

```text
/plugin install kapso@kapso
```

## Codex

Add the custom marketplace:

```bash
codex plugin marketplace add gokapso/agent-plugins
```

Install the plugin:

```bash
codex plugin install kapso@kapso
```

You can also browse and install plugins interactively from Codex after adding the marketplace.

For local testing, add this repository directory as the marketplace root:

```bash
codex plugin marketplace add /path/to/kapso-agent-plugins
codex plugin install kapso@kapso
```

## Prerequisites

- A Kapso account and access to the project you want to operate.
- Node.js 20+ for the bundled helper scripts.
- For MCP auth in Codex, run:

```bash
codex mcp login kapso
```

Direct API fallback scripts use:

```bash
export KAPSO_API_BASE_URL="https://api.kapso.ai"
export KAPSO_API_KEY="..."
```

## Validation

```bash
npm run validate
npm run check:syntax
```

CI runs both commands on every pull request and push to `main`.

## Safety

The plugin treats read-only inspection and local validation as safe defaults. Actions that send messages, deploy functions, mutate workflows, create templates, update webhooks, create setup links, or delete resources should be confirmed explicitly by the user before running.

Release checks reject local filesystem paths, obvious secret files, invalid JSON, unsafe remote MCP URLs, and incomplete marketplace metadata.
