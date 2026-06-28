# Debugging Workflow

## Message delivery failed

1. Collect message ID (`wamid.*`).
2. Inspect message lifecycle timeline.
3. Translate error codes into user-facing guidance (see "Meta error codes" below).

## Meta error codes

Map the Meta error `code` on failed status events to remediation:

- `131042` - Business eligibility / payment issue. See "Payment and currency errors" below.
- `131047` - Re-engagement message: the 24-hour window has closed; reopen it with an approved template.
- `131026` - Message undeliverable: confirm the recipient number is valid and on WhatsApp.
- `141000` - Tell the user to contact support.

### Payment and currency errors

Code **`131042`** ("Business eligibility payment issue") means the WhatsApp Business Account's
billing is blocking sends - typically the **"Payment method needed in Meta"** error users hit when
testing templates. Causes: no payment method configured, a currency mismatch between the payment
method and the WABA billing currency, or unverified business / billing flags.

Tell the user:

- This is a **Meta account billing problem, not a code or template bug** - it can't be fixed from Kapso.
- **Templates and other business-initiated sends are blocked, but replies inside an open 24-hour
  window still work** (matches the payment "Special case" in `health-reference.md`).
- Fix it in WhatsApp Manager / Meta Business Suite > Billing & payments: add or repair a payment
  method, confirm its currency matches the account currency, finish business verification if
  prompted, then retry the send.

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
