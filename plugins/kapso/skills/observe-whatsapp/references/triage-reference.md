# Debugging Workflow

## Message delivery failed

1. Collect message ID (`wamid.*`).
2. Inspect message lifecycle timeline.
3. Translate error codes into user-facing guidance.

## WhatsApp config issues

1. Run a health check on the phone number config.
2. Review token validity, messaging health, and webhook subscription.
3. Explain whether the issue is critical or degraded.

## Webhook delivery failures

1. Review recent delivery attempts.
2. Check response status codes and error messages.
3. Verify webhook URL availability and signature verification logic.

## API errors

1. Review external API call logs.
2. Filter by status code or endpoint.
3. Identify auth errors, rate limits, or upstream failures.

## Template creation rejected (Bad Request / Meta API error)

Kapso forwards template create/update calls straight to Meta, so rejections come back as
Meta API errors (often a bare **Bad Request** / `(#100)`), not Kapso validation messages.
Don't guess — map the failure to a cause:

1. **Bad Request at creation** — almost always an example/variable mismatch: a variable
   with no example, example keys that don't match `parameter_format` (NAMED vs POSITIONAL),
   a `param_name` that doesn't match the `{{...}}`, positional gaps, or a flat instead of 2D
   `body_text` array.
2. **Wrong category** — promotional wording in a UTILITY template, or custom body text in an
   AUTHENTICATION template (its body is fixed by Meta and it needs an OTP button).
3. **OAuthException 139000** — the WABA is not verified in Meta business verification; this
   blocks AUTHENTICATION templates and can block sending.
4. **Duplicate name/language** — a template with that `name` + `language` already exists.

Full cause → fix mapping (with corrected example payloads) lives in the
`integrate-whatsapp` skill: `references/templates-reference.md` → "Troubleshooting: why did
my template get rejected?".
