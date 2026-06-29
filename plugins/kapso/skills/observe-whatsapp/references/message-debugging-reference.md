# Message Debugging Playbook

## Message delivery failed

1. Identify the message ID (`wamid.*`).
2. Review the status timeline in order: sent -> delivered -> read.
3. Surface error codes and map them to remediation (see the error-code table below).

### Where error codes live

- Per-message: `kapso.status` is the headline (`pending`/`sent`/`delivered`/`read`/`failed`).
  The raw Meta status events — including any `errors[].code` and `errors[].title` — are in
  `kapso.statuses[]` (raw Meta payloads).
- Per-broadcast recipient: `error_message` (string) and `error_details` (the Meta error
  payload, with the numeric `code`). See "Broadcast / campaign failures" in
  [triage-reference.md](triage-reference.md).

## WhatsApp error-code reference

Codes are Meta WhatsApp Cloud API error codes. Lead with whether the failure is **expected**
(throttling/policy that resolves on its own) or **actionable** (a fix the user can make).

### Messaging limits and policy (the "high failure rate" cases)

| Code | Meaning | Expected? | Remediation |
|------|---------|-----------|-------------|
| `131049` | "This message was not delivered to maintain healthy ecosystem engagement." Meta's per-user **marketing-template frequency cap** — the recipient has already received enough marketing messages in the window. | Yes — not a bug | Don't retry the same marketing template at the same recipient. Reduce marketing volume per user, space sends out, and prioritize **utility/authentication** templates (not subject to the cap) for transactional content. Improve opt-in quality and relevance. A high `131049` share on a broadcast usually means too much marketing to the same audience, not a delivery defect. |
| `130472` | Recipient is part of Meta's marketing-message **experiment group**; the marketing message was intentionally not delivered. | Yes — not a bug | Same as `131049`: treat as expected suppression, not a fixable error. |
| `131048` | Spam rate limit hit — sending restricted because of low quality / too many sends. | Partly | Slow down sends and improve message quality. Check the number's quality rating and messaging health (run a health check). |
| `131031` | Business account locked or restricted (policy violation). | No | Escalate — the WABA is restricted. Check WhatsApp Manager account status; contact support. |
| `368` | Temporarily blocked for policy violations. | No | Review recent policy violations in WhatsApp Manager; resolve before resuming sends. |

### Delivery failures (recipient / window / throughput)

| Code | Meaning | Remediation |
|------|---------|-------------|
| `131026` | Message undeliverable — recipient can't receive it (not a WhatsApp user, hasn't accepted updated ToS, or the business isn't allowed to message them). | Confirm the number is on WhatsApp and correctly formatted (E.164, no `+` in API payloads). Don't keep retrying a number that consistently returns this. |
| `131047` | Re-engagement required — more than 24h since the user's last message, so free-form text is blocked. | Use an approved **template** to reopen the conversation; free-form messages only work inside the 24-hour customer-service window. |
| `131051` | Unsupported message type. | Send a supported type for the recipient/region. |
| `131053` | Media upload/download error. | Re-upload the media; verify size/format limits and that the media URL is reachable. |
| `130429` / `80007` | Rate limit (throughput) reached. | Back off and retry with spacing; reduce concurrent send rate. Transient. |
| `131000` | Generic "something went wrong" on Meta's side. | Transient — retry. If it persists, capture the message ID and `kapso.statuses[]` for escalation. |

### Template errors (business-initiated sends)

| Code | Meaning | Remediation |
|------|---------|-------------|
| `132000` | Number of template parameters doesn't match the template. | Send exactly the parameters the approved template defines. |
| `132001` | Template doesn't exist or isn't approved in this language. | Verify the template name + language code; confirm it's APPROVED for the WABA. |
| `132005` | Hydrated template text is too long. | Shorten parameter values so the rendered message fits Meta's limit. |
| `132007` / `132015` | Template paused for low quality. | The template is paused by Meta; fix content quality or use a different approved template. |
| `132012` | Parameter format mismatch. | Match the expected parameter format (e.g. currency/date/number components). |
| `132016` | Template disabled. | Template was disabled; resubmit or switch templates. |

### Eligibility / auth

| Code | Meaning | Remediation |
|------|---------|-------------|
| `131042` | Business eligibility / payment-method issue. | Templates blocked until billing is fixed; 24-hour-window messages still work. Fix the payment method in WhatsApp Manager. |
| `133xxx` | Phone-number registration errors. | The number isn't correctly registered with Cloud API. Re-run health checks; escalate if registration is incomplete. |
| `141000` | See [health-reference.md](health-reference.md) §12 — contact support. |

> This is not exhaustive. For an unlisted code, report the numeric code + Meta `title`/message
> verbatim, say whether it looks transient (retry) or actionable, and point the user at Meta's
> Cloud API error reference rather than guessing.

## Common issues to confirm

- Recipient phone number formatting and registration.
- Template approval status (for business-initiated messages).
- Messaging health status (LIMITED/BLOCKED).
- Webhook subscription and inbound event receipt.
