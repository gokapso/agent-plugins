# Debugging Workflow

## Message delivery failed

1. Collect message ID (`wamid.*`).
2. Inspect message lifecycle timeline.
3. Translate error codes into user-facing guidance.

## WhatsApp config issues

1. Run a health check on the phone number config.
2. Review token validity, messaging health, and webhook subscription.
3. Explain whether the issue is critical or degraded.

## Broadcast / campaign failures

Broadcast (campaign) data lives in the **platform API**, not in PostHog analytics — there is no
broadcast or delivery-status event to query in product analytics, so triage from the API.

Use this when a campaign shows a **high failure rate** or when the broadcast detail page in the
app won't load (the API is the workaround to read the same data).

1. **Find the broadcast and read its counts.** List broadcasts (optionally `--status failed`)
   and inspect one. The `WhatsappBroadcast` carries `sent_count`, `failed_count`,
   `delivered_count`, `read_count`, `pending_count`, `response_rate`, and `status`
   (`draft`/`scheduled`/`sending`/`stopped`/`completed`/`failed`).
   - `node scripts/broadcasts.js --status failed`
   - `node scripts/broadcasts.js --broadcast-id <id>`
2. **Drill into failed recipients to get the error codes.** Each `WhatsappBroadcastRecipient`
   carries `status`, `error_message`, and `error_details` (the Meta error payload with the
   numeric `code`).
   - `node scripts/broadcasts.js --broadcast-id <id> --recipients --failed-only`
3. **Map the codes to remediation** using the error-code table in
   [message-debugging-reference.md](message-debugging-reference.md).
   - A large share of `131049` (or `130472`) is **expected** — Meta's per-user marketing-message
     cap, not a delivery defect. Lead with that: the campaign sent too many marketing templates
     to the same audience; reduce frequency and prefer utility/authentication templates. Do not
     report it as a bug to fix.
   - Codes like `131026`, `131047`, `132xxx` point at recipient/window/template problems that
     *are* actionable.
4. **Cross-reference** `api-logs` and `webhook-deliveries` only if the failures look like
   transport/API problems (auth, rate limit, upstream 5xx) rather than per-recipient Meta codes.

The OpenAPI broadcast endpoints (`listWhatsappBroadcasts`, `getWhatsappBroadcast`,
`listWhatsappBroadcastRecipients`) can be explored with
`node scripts/openapi-explore.mjs --spec platform search "broadcast"`.

## Webhook delivery failures

1. Review recent delivery attempts.
2. Check response status codes and error messages.
3. Verify webhook URL availability and signature verification logic.

## API errors

1. Review external API call logs.
2. Filter by status code or endpoint.
3. Identify auth errors, rate limits, or upstream failures.
