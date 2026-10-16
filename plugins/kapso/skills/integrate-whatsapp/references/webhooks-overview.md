---
title: Webhooks Overview (Kapso)
---

# Webhooks Overview

## Webhook types

### Project webhooks
Project-wide events (for example, `whatsapp.phone_number.created`).
Use **project webhooks** for connection lifecycle and workflow events only.

### WhatsApp webhooks
Message and conversation events for a specific `phone_number_id`.
Use **phone-number webhooks** for `whatsapp.message.*` and `whatsapp.conversation.*` events only.
WhatsApp message events cannot be delivered via project webhooks.

Kinds:

- **Kapso webhooks** (default): event-based payloads, filtering, buffering.
- **Meta webhooks**: raw Meta payloads, no filtering or buffering. One meta webhook per phone number.

Meta webhooks include `X-Idempotency-Key` (SHA256 hash of payload) for deduplication.

## Response requirements

- Your endpoint must return `200 OK` within 10 seconds.
- Non-200 responses trigger retries.

Retry schedule (Kapso webhooks):
- 10 seconds
- 40 seconds
- 90 seconds

## Signature verification

Kapso signs webhook requests:

- Header: `X-Webhook-Signature`
- Value: `HMAC-SHA256(webhook_secret_key, raw_request_body)` as hex

Verify against raw request bytes before parsing JSON.

## Headers (Kapso webhooks)

- `X-Webhook-Event`
- `X-Webhook-Signature`
- `X-Idempotency-Key`
- `X-Webhook-Payload-Version`
- `Content-Type: application/json`

Batched payloads may include:

- `X-Webhook-Batch: true`
- `X-Batch-Size: <n>`

## Troubleshooting: "Last delivery: Failed"

A "Failed" status is determined entirely by how your **receiving endpoint** responded — not by which events the webhook subscribes to or its buffering/debouncing settings. Changing event triggers or buffering does **not** affect delivery success, so re-editing those settings will never clear a failed delivery.

Common causes:

- **Non-200 response**: the endpoint returned a status other than `200 OK`. Kapso retries (see retry schedule above), then marks the delivery failed.
- **Timeout**: the endpoint did not respond within 10 seconds.
- **Signature mismatch**: the endpoint rejected the request while verifying `X-Webhook-Signature` (commonly from hashing parsed JSON instead of the raw request bytes — see [Signature verification](#signature-verification)).
- **Wrong webhook scope**: the event is not delivered on this webhook. `whatsapp.message.*` and `whatsapp.conversation.*` are delivered only on phone-number webhooks; lifecycle/workflow events only on project webhooks. See `webhooks-reference.md`.

Diagnose the endpoint (don't edit triggers or buffering):

1. Inspect the actual delivery attempts, response codes, and errors — `webhook-deliveries.js` in the `observe-whatsapp` skill:
   ```bash
   node scripts/webhook-deliveries.js --errors-only true
   ```
   Also supports `--status <value>`, `--event <value>`, `--webhook-id <id>`, and `--period <24h|7d|30d>`.
2. Re-send a controlled test delivery to the endpoint — `test.js` in the `integrate-whatsapp` skill:
   ```bash
   node scripts/test.js --webhook-id <id>
   ```

Then fix the endpoint (return `200 OK` within 10 seconds; verify the signature against the raw request bytes) and re-test.
