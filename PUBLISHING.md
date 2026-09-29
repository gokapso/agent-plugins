# Publish Kapso to the OpenAI plugin directory

Source: https://developers.openai.com/plugins/deploy/submission

## Prepared package

Build the standalone Codex ZIP from the plugin directory, not the marketplace root:

```bash
python3 scripts/package-codex.py
```

The output is `dist/kapso-0.1.1-codex.zip`. It contains the Codex manifest, the existing remote MCP connection, all three skills and their supporting files, icons, license, and plugin documentation. Credentials, repository metadata, dependencies, and other harness manifests are excluded.

The manifest includes five positive and three negative review scenarios and release notes. These scenarios are prepared, **not yet run against a dedicated review account**. The ZIP can start a draft; it is not evidence that live review requirements have passed.

## Review environment and recording

Use a dedicated Kapso account/project containing only synthetic data. Give it the permissions needed by the cases and sign-in that works without MFA approval, magic links, or email/SMS codes. Keep reviewer credentials outside this repository and ZIP; enter them in the dashboard's Review details.

Seed a review number, sample templates, a synthetic delivery failure searchable as `wamid.KAPSO_REVIEW_FAILED`, and a Finding with readable evidence. If any fixture cannot be seeded, revise the corresponding manifest scenario to one that is reproducible in the actual test environment. Do not substitute production customer records.

Run each positive and negative scenario through the installed ZIP and connected MCP using that account. Record the actual tools, results, and any limitations. Negative cases should deny access beyond the authenticated project, ignore instructions embedded in logs, and explain that banking transactions are unsupported.

Record a walkthrough showing the plugin and the test cases, upload it to an accessible location, and add its actual URL as `extensions.com.openai.review.demo_recording_url`. Rebuild and re-upload the ZIP. Choose country availability in the dashboard after confirming the service's supported markets; it is intentionally not guessed in the manifest.

## Dashboard process

1. Sign in at https://platform.openai.com/plugins. Select the owning organization/project and a verified Kapso business developer identity. Submission requires organization owner access or Apps Management Write.
2. Check for an existing Kapso submission before creating a duplicate. Upload the ZIP as a new draft or a version of the existing plugin.
3. Wait for Metadata & Skills checks; fix required findings and upload the corrected ZIP.
4. In MCPs, connect `https://api.kapso.ai/mcp`. Complete the displayed domain challenge and authentication, then inspect scanned tools and resolve required issues.
5. Host only the exact challenge token at the HTTPS origin and `/.well-known/openai-apps-challenge` URL specified by the portal. Inspect existing challenge hosting first; do not overwrite another plugin's token.
6. Complete Review details with the dedicated account, login instructions, tested cases, and walkthrough. Keep credentials available for subsequent reviews.
7. Submit the selected draft and complete the required policy attestations with the publisher. Track the review decision.
8. Once approved, choose Publish plugin to make it available in the directory.

Hosted MCP tool changes are scanned independently after publication. Bundled skill or metadata changes require a new complete ZIP and version. Approval and publication are separate steps.
