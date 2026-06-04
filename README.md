# Kapso Agent Plugins

Use Kapso with your favorite agent harness.

This repository follows the multi-agent marketplace layout used by Paper Design:

```text
kapso-agent-plugins/
├── .agents/plugins/marketplace.json
├── .claude-plugin/marketplace.json
├── .cursor-plugin/marketplace.json
└── plugins/
    └── kapso/
        ├── .codex-plugin/plugin.json
        ├── .claude-plugin/plugin.json
        ├── .cursor-plugin/plugin.json
        ├── .mcp.json
        ├── mcp.json
        ├── rules/
        ├── skills/
        ├── scripts/
        └── assets/
```

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

For local testing, add this directory as the marketplace root:

```bash
codex plugin marketplace add /Users/clementeortuzar/dev/kapso/kapso-agent-plugins
codex plugin install kapso@kapso
```

## What It Includes

- Skills for integrating WhatsApp, automating WhatsApp workflows, and observing WhatsApp production issues.
- Kapso MCP server configs at `plugins/kapso/mcp.json` and `plugins/kapso/.mcp.json`.
- Agent-specific manifests for Codex, Cursor, and Claude Code.
- Shared Kapso branding, scripts, examples, and safety guidance.

## Validation

```bash
npm run validate
```
