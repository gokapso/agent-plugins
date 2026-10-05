# Publish Kapso to the OpenAI plugin directory

Source: https://developers.openai.com/plugins/deploy/submission

## Prepared package

Build the standalone Codex ZIP from the plugin directory, not the marketplace root:

```bash
python3 scripts/package-codex.py
```

The output is `dist/kapso-0.1.3-codex.zip`. It contains the Codex manifest, the existing remote MCP connection, all three skills and their supporting files, icons, license, and plugin documentation. Credentials, repository metadata, dependencies, and other harness manifests are excluded.

The Codex manifest uses the existing submission identifier `app-69e50baf29a48191847ceec3bfd887a4`; keep it when uploading a replacement ZIP. The displayed plugin name remains Kapso. The integration skill is synchronized from agent-skills commit `6685971` in [PR #24](https://github.com/gokapso/agent-skills/pull/24), with the plugin's MCP guidance retained. The other two skills keep their existing plugin guidance.

The manifest includes seven positive and three negative review scenarios and release notes. These scenarios are prepared, **not yet run against a dedicated review account**. The ZIP can start a draft; it is not evidence that live review requirements have passed.

## Backend deployment before release

Version 0.1.3 depends on the Rails inbox UI and first-account onboarding changes from
`feat/codex-plugin-conversation-ui` in `gokapso/cientos-rails`. Merge and deploy those
changes with the plugin UI assets built before releasing this package. The package
keeps the production MCP URL `https://api.kapso.ai/mcp`; it contains no local endpoint,
API key, test login, or fixed project. Inspect any explicit plugin UI project allowlist
and enable the intended review projects before testing. Register the production Meta
callback required by the Rails setup UI in the participating Meta apps.

After deployment, rescan the MCP tools in the existing OpenAI plugin submission.
New tools must be available in that scan before testing the new UI scenarios. Upload
the new complete ZIP to the existing submission, keeping its identifier. Do not publish
before testing OAuth from both a fresh account and an existing signed-in account,
coexistence path selection, conversation cards, a reviewed reply, and reconnect.

The CLI can install without starting OAuth. Test installation through the Codex UI;
its marketplace authentication policy is `ON_INSTALL`. Account connection should open
sign-in or registration, then project consent. Existing browser login skips sign-in.

## Review environment and recording

Use a dedicated Kapso account/project containing only synthetic data. Give it the permissions needed by the cases and sign-in that works without MFA approval, magic links, or email/SMS codes. Keep reviewer credentials outside this repository and ZIP; enter them in the dashboard's Review details.

Seed a review number, sample templates, a synthetic delivery failure searchable as `wamid.KAPSO_REVIEW_FAILED`, and a Finding with readable evidence. If any fixture cannot be seeded, revise the corresponding manifest scenario to one that is reproducible in the actual test environment. Do not substitute production customer records.

Run each positive and negative scenario through the installed ZIP and connected MCP using that account. Record the actual tools, results, and any limitations. Negative cases should deny access beyond the authenticated project, ignore instructions embedded in logs, and explain that banking transactions are unsupported.

Also run these release acceptance checks against the deployed Cientos behavior. They
are prepared checks, not claims of completed production validation. Use synthetic
customers and conversations; exercise uncertain sends with a controlled provider
fixture in the test environment.

| Check | Expected behavior |
| --- | --- |
| OAuth project roles | An owner/admin can enter number setup. A member receives `can_connect_whatsapp: false`, an explanation of the permission requirement, and accessible inbox/read guidance. The assistant does not call setup tools or use CLI/API credentials to bypass the restriction. |
| Multiple customers with an existing link | With at least two customers and a prior setup link for one, a coexistence request without a customer preserves the requested method but asks for the business in the UI. It does not select the owner of the old link automatically. After selection, the flow proceeds for that customer. A sole customer still proceeds automatically. |
| Interrupted signup recovery | Interrupt Meta authorization or return while the backend is still connecting, then reopen the same customer's setup. The flow resumes the matching attempt or reports its actual retry/error state. Completion opens the inbox without creating a duplicate setup or claiming success before the callback is accepted. |
| Uncertain send outcome | A timeout or `started`/`unknown` outcome retains the draft and pauses further sends. The panel checks the original attempt; neither the assistant nor a refresh sends it again. An unresolved outcome requires provider evidence before reconciliation. An accepted send is not reported as delivered until delivery evidence exists. |

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
