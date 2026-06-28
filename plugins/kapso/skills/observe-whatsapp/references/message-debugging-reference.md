# Message Debugging Playbook

## Message delivery failed

1. Identify the message ID (`wamid.*`).
2. Review the status timeline in order: sent -> delivered -> read.
3. Surface error codes in status events and map to remediation.

## Common issues to confirm

- Recipient phone number formatting and registration.
- Template approval status (for business-initiated messages).
- Messaging health status (LIMITED/BLOCKED).
- Webhook subscription and inbound event receipt.

## Meta error code reference

Failed status events carry a Meta error `code` (see `message.kapso.statuses[].errors[]`). Map the
code to remediation rather than echoing the raw title.

| Code | Meaning | What to tell the user |
|------|---------|-----------------------|
| `131042` | Business eligibility / payment issue | A payment method or billing setting on the WhatsApp Business Account is blocking sends. See "Payment and currency errors" below. |
| `131047` | Re-engagement message | More than 24 hours have passed since the recipient last replied; send an approved template to reopen the window. |
| `131026` | Message undeliverable | Recipient can't receive the message (not on WhatsApp, number unregistered, or device issue). Confirm the number. |
| `141000` | (see health reference) | Tell the user to contact support. |

### Payment and currency errors

Meta returns code **`131042`** ("Business eligibility payment issue") when the WhatsApp Business
Account's billing isn't usable. The most common triggers, including the **"Payment method needed
in Meta"** message users see when testing templates, are:

- **No payment method configured** on the WhatsApp Business Account.
- **Currency mismatch** between the payment method and the WABA's billing currency.
- Business not verified, or a credit line / billing setting that Meta has flagged.

Key point for the user: this is an **account billing problem in Meta, not a code or template bug**.
While it is unresolved, **template and other business-initiated sends are blocked, but replies
inside an open 24-hour customer-service window still work** (same behavior as the messaging-health
payment "Special case" in `health-reference.md`).

Remediation to give the user:

1. Open WhatsApp Manager / Meta Business Suite > Billing & payments for the WhatsApp Business Account.
2. Add or fix a valid payment method, and confirm its currency matches the account's billing currency.
3. Complete business verification if Meta is prompting for it.
4. Retry the template test send after Meta clears the block (it is not fixable from Kapso).
