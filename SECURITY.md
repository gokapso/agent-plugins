# Security Policy

Kapso agent plugins can operate production WhatsApp resources, so security issues in this repository are taken seriously.

## Reporting a Vulnerability

Please do not open a public issue for suspected vulnerabilities, leaked credentials, or bypasses in safety checks.

Report security concerns through GitHub private vulnerability reporting when available, or contact Kapso at dev@kap.so with:

- A short description of the issue.
- The affected file, script, skill, or workflow.
- Steps to reproduce when possible.
- Any logs or screenshots with secrets removed.

## Scope

Security-sensitive areas include:

- Scripts that send `KAPSO_API_KEY` or other credentials.
- MCP server configuration.
- Skills or examples that could cause unintended sends, deletes, deploys, webhook changes, template creation, setup-link creation, or workflow mutation.
- Release validation that should prevent accidental publication of secrets, local paths, or unsafe artifacts.

## Handling Secrets

Never commit `.env` files, real API keys, private keys, webhook secrets, access tokens, customer data, production phone numbers, or raw logs containing message content. Use placeholders in examples and run:

```bash
npm run validate
npm run check:syntax
```

before opening a pull request.
