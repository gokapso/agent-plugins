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

1. Start with unified log search for the webhook ID, URL text, event name, or recent problem events.
2. Review recent delivery attempts.
3. Check response status codes and error messages.
4. Verify webhook URL availability and signature verification logic.

## API errors

1. Start with unified log search for the request ID, endpoint, phone ID, `wamid.*`, or response status.
2. Review external API call logs when you need the older narrow list view.
3. Filter by status code or endpoint.
4. Identify auth errors, rate limits, or upstream failures.
