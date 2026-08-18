# WhatsApp Templates via Meta Proxy

## Environment

Required env vars:

- `KAPSO_API_BASE_URL` (host only, no `/platform/v1`, e.g. `https://api.kapso.ai`)
- `KAPSO_API_KEY`
- `META_GRAPH_VERSION` (optional, default: `v24.0`)
- `KAPSO_META_BASE_URL` (optional, defaults to `${KAPSO_API_BASE_URL}/meta/whatsapp`)

## Discover IDs (recommended)

Template CRUD requires `business_account_id` (WABA ID). Sending messages and uploading media require `phone_number_id` (Meta phone number id).

Use the Platform API to discover both:

- Script: `node scripts/list-platform-phone-numbers.mjs`
- Raw: `GET /platform/v1/whatsapp/phone_numbers` (header: `X-API-Key: $KAPSO_API_KEY`)

## Meta proxy endpoints used

- List WABA phone numbers:
  - `GET /{business_account_id}/phone_numbers`
- List templates:
  - `GET /{business_account_id}/message_templates`
- Create template:
  - `POST /{business_account_id}/message_templates`
- Update template:
  - `POST /{business_account_id}/message_templates?hsm_id=<template_id>`
- Delete template (not scripted):
  - `DELETE /{business_account_id}/message_templates?name=<template_name>`
- Send template message:
  - `POST /{phone_number_id}/messages`
- Upload media for send-time headers:
  - `POST /{phone_number_id}/media`

## Template concepts

Categories:
- MARKETING: promotional content.
- UTILITY: transactional updates.
- AUTHENTICATION: OTP/verification (special rules below).

AUTHENTICATION templates:
- Require Meta business verification.
- Body text is fixed by Meta (not customizable).
- Must include an OTP button (COPY_CODE or ONE_TAP).
- Send-time still requires the OTP value in body param {{1}} and URL button param.
- If user wants custom OTP text, use UTILITY instead.

Status flow:
- Kapso does not maintain a separate draft state; create/update calls go to Meta immediately.
- Use `status` from Meta (`APPROVED`, `PENDING`, `REJECTED`, etc) via list/status scripts.

Parameter types:
- POSITIONAL: `{{1}}`, `{{2}}` (sequential).
- NAMED: `{{customer_name}}` (lowercase + underscores). Prefer NAMED.

Component types:
- HEADER (optional)
- BODY (required)
- FOOTER (optional)
- BUTTONS (optional)

## Template naming rules

- `name` must be **lowercase letters, numbers, and underscores only** (`^[a-z0-9_]+$`). No spaces, uppercase, hyphens, or other punctuation — these surface as an invalid-character error.
- Max length 512 characters.
- **Names are unique per WhatsApp Business Account (WABA).** Reusing a name that already exists in the same WABA fails with **"template name already exists"**, even if that template is rejected or in another language. This is the most common create-form dead-end.
- Recovery when a name collides — pick one:
  1. **Choose a different, unique name** (e.g. append a version or date suffix: `order_ready_v2`).
  2. **Update the existing template instead of creating a new one** — `POST /{business_account_id}/message_templates?hsm_id=<template_id>` (or `node scripts/update-template.mjs`). Find the existing template's id with `node scripts/list-templates.mjs --business-account-id <WABA_ID>`.
  3. **Delete the old template first** — `DELETE /{business_account_id}/message_templates?name=<template_name>` — then recreate. Note Meta blocks reusing a deleted name for ~30 days.
- The same name **can** be reused across *different* WABAs, which is why switching WhatsApp accounts clears the collision. Switching accounts is a workaround, not a fix — prefer a unique name or an update.

## Pre-submit validation checklist

Check all of these **before** submitting a create/update — Meta (and the create form) reject on submit, not inline, so catching them up front avoids a round-trip:

- [ ] **Name** is lowercase/numbers/underscores only, ≤512 chars, and **not already used in this WABA** (see naming rules above).
- [ ] **Every button has non-empty `text`.** Empty quick-reply (or URL/phone) button text is rejected. Button text ≤25 chars. If a button is unused, remove it rather than leaving it blank.
- [ ] **Buttons are not interleaved** — group all QUICK_REPLY together, then URL/PHONE_NUMBER (see button ordering rules below). Max 10 buttons.
- [ ] **Every variable in HEADER/BODY has an example value** (see example requirements). Missing examples fail with **"Please provide example values for all parameters."** Named params: each `{{param_name}}` needs a matching entry in `header_text_named_params` / `body_text_named_params`. Positional: `example.header_text` / 2D `example.body_text` must cover every `{{n}}`.
- [ ] **URL buttons with a `{{1}}` variable** include an `example` array.
- [ ] **Positional placeholders have no gaps** — `{{1}}`, `{{2}}`, ... with nothing skipped.
- [ ] **`language` is set** (e.g. `en_US`) — use `language`, not `language_code`.
- [ ] **Body text** is within limits (≤1024 chars) and avoids leading/trailing whitespace, more than 4 consecutive spaces, or newlines/tabs where Meta disallows them.

## Parameter format (creation time)

Set `parameter_format`:
- `POSITIONAL` (default): `{{1}}`, `{{2}}` with no gaps.
- `NAMED` (recommended): `{{order_id}}`.

## Example requirements (creation time)

If any variables appear in HEADER or BODY, you must include examples:
- POSITIONAL: `example.header_text` and 2D `example.body_text`.
- NAMED: `example.header_text_named_params` and `example.body_text_named_params`.

## Components cheat sheet (creation time)

### Header (TEXT, named)

```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Sale starts {{sale_date}}",
  "example": {
    "header_text_named_params": [
      { "param_name": "sale_date", "example": "December 1" }
    ]
  }
}
```

### Header (TEXT, positional)

```json
{
  "type": "HEADER",
  "format": "TEXT",
  "text": "Sale starts {{1}}",
  "example": {
    "header_text": ["December 1"]
  }
}
```

### Header (IMAGE/VIDEO/DOCUMENT)

```json
{
  "type": "HEADER",
  "format": "IMAGE",
  "example": {
    "header_handle": ["<header_handle>"]
  }
}
```

### Body (named)

```json
{
  "type": "BODY",
  "text": "Hi {{customer_name}}, order {{order_id}} is ready.",
  "example": {
    "body_text_named_params": [
      { "param_name": "customer_name", "example": "Alex" },
      { "param_name": "order_id", "example": "ORDER-123" }
    ]
  }
}
```

### Body (positional)

```json
{
  "type": "BODY",
  "text": "Order {{1}} is ready for {{2}}.",
  "example": {
    "body_text": [["ORDER-123", "Alex"]]
  }
}
```

### Footer (no variables)

```json
{
  "type": "FOOTER",
  "text": "Reply STOP to opt out"
}
```

### Buttons

```json
{
  "type": "BUTTONS",
  "buttons": [
    { "type": "QUICK_REPLY", "text": "Need help" },
    { "type": "URL", "text": "Track", "url": "https://example.com/track?id={{1}}", "example": ["https://example.com/track?id=ORDER-123"] }
  ]
}
```

Button ordering rules:
- Do not interleave QUICK_REPLY with URL/PHONE_NUMBER.
- Valid: QUICK_REPLY, QUICK_REPLY, URL, PHONE_NUMBER
- Invalid: QUICK_REPLY, URL, QUICK_REPLY
- Dynamic URL variables must be at the end of the URL.

URL button variables use positional placeholders in the URL (for example `{{1}}`). At send-time, include a `button` component with `sub_type: "url"` and the correct `index`.

Example (send-time URL button param):

```json
{
  "type": "button",
  "sub_type": "url",
  "index": "0",
  "parameters": [{ "type": "text", "text": "ORDER-123" }]
}
```

## AUTHENTICATION components

```json
{
  "type": "BODY",
  "add_security_recommendation": true,
  "code_expiration_minutes": 10
}
```

```json
{
  "type": "BUTTONS",
  "buttons": [
    { "type": "OTP", "otp_type": "COPY_CODE", "text": "Copy code" }
  ]
}
```

## Send-time components

Named parameters:

```json
{
  "type": "body",
  "parameters": [
    { "type": "text", "parameter_name": "order_id", "text": "ORDER-123" }
  ]
}
```

Positional parameters:

```json
{
  "type": "body",
  "parameters": [
    { "type": "text", "text": "ORDER-123" }
  ]
}
```

AUTHENTICATION send-time:

```json
[
  {
    "type": "body",
    "parameters": [{ "type": "text", "text": "123456" }]
  },
  {
    "type": "button",
    "sub_type": "url",
    "index": "0",
    "parameters": [{ "type": "text", "text": "123456" }]
  }
]
```

Media header send-time (use id or link, not both):

```json
{
  "type": "header",
  "parameters": [
    { "type": "image", "image": { "id": "4490709327384033" } }
  ]
}
```

## Header handle limitation

The Meta proxy does not expose resumable upload endpoints for `header_handle`. Use Platform media ingest (`/platform/v1/whatsapp/media` with `delivery: meta_resumable_asset`) if a header_handle is required.

```json
{
  "type": "header",
  "parameters": [
    { "type": "image", "image": { "link": "https://example.com/header.jpg" } }
  ]
}
```

Rules:

- Use either `id` or `link` (never both).
- Always include the header component when the template has a media header.

## Common creation errors and recovery

| Error on submit | Cause | Fix |
|-----------------|-------|-----|
| `template name already exists` | Name already used in this WABA (per-WABA uniqueness) | Use a unique name, update the existing template via `hsm_id`, or delete the old one first (see naming rules). Switching WhatsApp accounts also clears it but is only a workaround. |
| `Please provide example values for all parameters` | A `{{variable}}` in HEADER/BODY (or a URL button) has no example | Add the matching `example` entry for every parameter (see example requirements + checklist). |
| Invalid-character / invalid-name error | Name has uppercase, spaces, hyphens, or punctuation | Rename to lowercase letters, numbers, and underscores only. |
| Empty / missing button text | A quick-reply, URL, or phone button has blank `text` | Give every button non-empty text (≤25 chars) or remove the unused button. |
| Button ordering / interleave error | QUICK_REPLY interleaved with URL/PHONE_NUMBER | Group all QUICK_REPLY first, then URL/PHONE_NUMBER. |

Run through the **Pre-submit validation checklist** above before any create/update to avoid these.
