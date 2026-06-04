# Contributing

Thanks for improving Kapso agent plugins.

## Local Checks

Run these before opening a pull request:

```bash
npm run validate
npm run check:syntax
```

`npm run validate` checks marketplace structure, Codex manifest metadata, JSON parseability, release hygiene, MCP URLs, documentation sections, and common secret or local-path mistakes.

## Safety Expectations

- Keep examples synthetic. Use `example.com`, placeholder IDs, and test phone numbers.
- Do not commit credentials, `.env` files, logs, raw customer data, or production message payloads.
- Treat sends, deletes, workflow mutations, template changes, webhook changes, setup links, and function deploys as explicit-approval actions in skills and scripts.
- Prefer HTTPS for Kapso API endpoints. Localhost and insecure HTTP should remain opt-in for trusted development only.

## Plugin Structure

The public marketplace entry is `kapso`, located at `plugins/kapso`.

Important files:

- `.agents/plugins/marketplace.json`: Codex marketplace entry.
- `.cursor-plugin/marketplace.json`: Cursor marketplace entry.
- `.claude-plugin/marketplace.json`: Claude Code marketplace entry.
- `plugins/kapso/.codex-plugin/plugin.json`: Codex plugin manifest.
- `plugins/kapso/skills/*/SKILL.md`: skill instructions.
- `plugins/kapso/skills/*/references/`: reference material that skills load on demand.
- `plugins/kapso/skills/*/scripts/`: helper scripts used by the skills.

## Documentation

When adding or changing a skill, update:

- The relevant `SKILL.md`.
- Any referenced examples or reference docs.
- `plugins/kapso/README.md` if the public capability changes.
- `README.md` if installation or repository-level behavior changes.
