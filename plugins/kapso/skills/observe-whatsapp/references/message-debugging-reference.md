# Message Debugging Playbook

## Message delivery failed

1. Identify the message ID (`wamid.*`).
2. Review the status timeline in order: sent -> delivered -> read. A failed
   message stops at `failed` (e.g. sent -> failed); see
   [delivery-error-codes.md](delivery-error-codes.md) and the worked
   [failed-delivery example](../assets/message-debugging-failed-example.json).
3. Surface error codes in the failed status event and map them to a cause and
   remediation using the table in
   [delivery-error-codes.md](delivery-error-codes.md).

## Common issues to confirm

- Recipient phone number formatting and registration.
- Template approval status (for business-initiated messages).
- Messaging health status (LIMITED/BLOCKED).
- Webhook subscription and inbound event receipt.
