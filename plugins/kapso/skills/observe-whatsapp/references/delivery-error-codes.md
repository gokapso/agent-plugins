# Delivery Error Codes

Map Meta WhatsApp Cloud API delivery error codes to a plain-language cause and a
concrete remediation. Use this when a message status is `failed`, or when a user
reports "Message Undeliverable" / "Message was not delivered".

## Where to find the code

The error lives in the message status history, not the top-level message. Look in
`message.kapso.statuses[]` for the entry with `status: "failed"`, then read its
`errors[]` array:

```json
{
  "status": "failed",
  "timestamp": "1730093200",
  "recipient_id": "15551234567",
  "errors": [
    { "code": 131047, "title": "Re-engagement message", "message": "More than 24 hours have passed since the recipient last replied" }
  ]
}
```

- CLI: `kapso whatsapp messages get <message-id> --phone-number-id <id> --output json`
- Fallback: `node scripts/message-details.js --message-id <id>`
- Bulk failures: `node scripts/errors.js`

If no `errors[]` is present but the message never advanced past `sent`, treat it as
an in-flight or undelivered state (see code `131026` guidance).

## Code reference

| Code | Title / cause | What it means | Remediation |
|------|---------------|---------------|-------------|
| **131047** | Re-engagement message | The 24-hour customer service window expired — more than 24 hours passed since the recipient last messaged the business, so free-form messages are blocked. | Send an approved **template** message to re-open the conversation. This is the most common delivery failure. See [Re-engagement pattern](#re-engagement-pattern-24-hour-window) below to automate it. |
| **131026** | Message undeliverable | Meta could not deliver the message. Common causes: recipient is not a WhatsApp user, the number is not registered, the recipient hasn't accepted WhatsApp's latest Terms, an old WhatsApp version, or the business cannot message this recipient (e.g. region/policy). | Verify the recipient number is on WhatsApp and correctly E.164-formatted. For business-initiated messages confirm a template is used and the number opted in. Not retryable as-is. |
| **131049** | Healthy-ecosystem limit | Meta intentionally did not deliver this marketing message to protect the user experience (per-user marketing message frequency cap). | Reduce marketing send frequency to this recipient; prioritize utility/auth templates. Retrying the same marketing template will keep failing. |
| **131000** | Generic / something went wrong | An unexpected internal Meta error; usually transient. | Retry the send after a short delay. If it persists, collect the message ID + timestamp and escalate. |
| **131048** | Spam rate limit hit | Messaging blocked because the account hit a spam/quality rate limit. | Slow down sends and improve message quality/opt-in. Check messaging health (`kapso whatsapp numbers health`). |
| **131051** | Unsupported message type | The message type sent is not supported. | Resend using a supported type (text, template, interactive, supported media). |
| **131052** / **131053** | Media download / upload error | Meta could not download (inbound) or the upload (outbound) media failed. | Re-upload the media; verify size/format limits and that the media URL is reachable. |
| **132000** | Template param count mismatch | Number of parameters supplied does not match the template definition. | Align the parameter count with the approved template. Use `integrate-whatsapp` to inspect the template. |
| **132001** | Template does not exist | The template name/language pair is not found or not approved for this number. | Confirm the template is approved and the language matches. |
| **132005** | Template hydrated text too long | Parameter values made the rendered template exceed length limits. | Shorten parameter values. |
| **132012** | Template param format mismatch | A parameter value violates the template's expected format. | Fix the parameter formatting to match the template. |
| **132015** / **132016** | Template paused / disabled | The template was paused or disabled by Meta for quality reasons. | Use a different template or fix quality issues, then resubmit for approval. |
| **133010** | Phone number not registered | The sending number is not registered on the Cloud API. | Complete number registration before sending. |
| **131031** | Account locked | The WhatsApp Business Account is locked/restricted (policy). | Resolve the account issue in WhatsApp Manager; escalate to support. |
| **130472** | User in experiment | The recipient is part of a Meta marketing-message experiment and was excluded. | Expected for some marketing sends; no action needed for this recipient. |
| **190** | Access token expired | The access token expired or was revoked. | Token cannot be fixed by the user directly; escalate to support / reconnect the number. |
| **368** | Temporarily blocked (policy) | The number is temporarily blocked for policy violations. | Review policy compliance; wait for the block to lift or escalate. |
| **80007** / **130429** | Rate limit | Throughput rate limit reached. | Back off and retry with lower throughput. |
| **1026** | Receiver incapable | The recipient cannot receive this message type (e.g. `address_message` unsupported on their client). | Fall back to a supported message type. |
| **409** | Message in-flight | Another message for this conversation is still in-flight. | Retry shortly. |

For the authoritative, full list see Meta's [Cloud API error codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes/).

## How to respond to a user

1. Read the failed status entry and pull `errors[0].code`.
2. Look up the row above and lead with the **cause** in plain language.
3. Give the **remediation** as the next action.
4. If the code is `131047` (or any window-expiry case), point them at the
   re-engagement pattern so the failure is prevented next time, not just explained.

## Re-engagement pattern (24-hour window)

`131047` recurs whenever a business tries to send a free-form message after the
24-hour customer service window has closed. Explaining it after the fact is not
enough — prevent it by reacting to the failure automatically.

Wire the `whatsapp.message.failed` event to a workflow that re-engages with an
approved template:

1. **Trigger** — create a `whatsapp_event` trigger on `whatsapp.message.failed`
   (see `automate-whatsapp/references/triggers.md`). Optionally scope it to a
   `phone_number_id`.
2. **Branch on the code** — in the workflow, inspect the failed status
   `errors[].code`; only proceed for `131047` (the re-engagement case).
3. **Re-engage with a template** — use a `send_template` node
   (see `automate-whatsapp/references/node-types.md`) to send an approved
   re-engagement template to the recipient. Templates are the only message type
   allowed once the window has closed.

A template that lands re-opens the 24-hour window when the user replies, so
subsequent free-form messages succeed.

For the failure payload shape, see
`integrate-whatsapp/references/webhooks-event-types.md` (`whatsapp.message.failed`).
A worked failed-delivery timeline is in
[../assets/message-debugging-failed-example.json](../assets/message-debugging-failed-example.json).
