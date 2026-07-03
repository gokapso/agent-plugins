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

## Parameter format (creation time)

Set `parameter_format`:
- `POSITIONAL` (default): `{{1}}`, `{{2}}` with no gaps.
- `NAMED` (recommended): `{{order_id}}`.

## Example requirements (creation time)

If any variables appear in HEADER or BODY, you must include examples:
- POSITIONAL: `example.header_text` and 2D `example.body_text`.
- NAMED: `example.header_text_named_params` and `example.body_text_named_params`.

## Troubleshooting: why did my template get rejected?

Kapso forwards create/update calls straight to Meta, so a bad template comes back as a
Meta API error (often a bare **Bad Request** / `(#100)`) rather than a Kapso validation
message. Map the failure to a cause and fix before resubmitting.

### Bad Request (`(#100)`) at creation time — almost always example/variable mismatch

The most common wall: the template has variables but the `example` block doesn't line up
with them. Check, in order:

| Cause | How to spot it | Fix |
|-------|----------------|-----|
| Missing example for a HEADER/BODY variable | A `{{...}}` placeholder has no matching entry in `example` | Provide exactly one example per variable in every component that uses variables. See [Components cheat sheet](#components-cheat-sheet-creation-time). |
| Example keys don't match `parameter_format` | Using `example.body_text` (positional keys) while `parameter_format: NAMED`, or `example.body_text_named_params` while `POSITIONAL` | NAMED → `header_text_named_params` / `body_text_named_params`; POSITIONAL → `header_text` / 2D `body_text`. |
| NAMED example `param_name` doesn't match the placeholder | `{{order_id}}` in text but the example lists `param_name: "orderId"` (or a typo) | Make every `param_name` exactly equal the `{{...}}` name (lowercase + underscores). |
| Positional placeholders have gaps | Text uses `{{1}}` and `{{3}}` but not `{{2}}`, or examples don't cover every index | Positional variables must be sequential with no gaps, and `body_text` must supply one value per placeholder. |
| Example count doesn't match variable count | 2 variables but 1 example (or vice-versa) | The number of examples must equal the number of variables in that component. |

Positional body examples are a **2D array** (`[["ORDER-123", "Alex"]]`), not a flat one —
a flat array is a frequent Bad Request cause.

### Rejected for the wrong category

Categories aren't interchangeable; Meta rejects (or silently re-categorizes) templates
whose content doesn't fit:

| Category | Allowed content | Common rejection |
|----------|-----------------|-------------------|
| MARKETING | Promotions, offers, announcements | — |
| UTILITY | Transactional updates tied to an existing order/account | Promotional wording in a UTILITY template → rejected or bumped to MARKETING |
| AUTHENTICATION | OTP / verification only | Custom body text (body is **fixed by Meta**), or no OTP button; also **requires Meta business verification** (see below) |

If you need custom OTP wording, use **UTILITY** instead of AUTHENTICATION.

### OAuthException 139000 — WABA not verified

A `139000` (Integrity) error means the WhatsApp Business Account has not completed **Meta
business verification**. This blocks AUTHENTICATION templates and can block sending. Fix:
verify the business in Meta Security Center / Business Manager, then retry. This is the same
error surfaced when Flows integrity checks fail.

### Duplicate name / language

Creating a template whose `name` + `language` already exists returns an error. List existing
templates first (`node scripts/list-templates.mjs`) and pick a new name or update the
existing one via `hsm_id`.

### Button rejections

See [Button ordering rules](#buttons): don't interleave QUICK_REPLY with URL/PHONE_NUMBER,
and dynamic URL variables must sit at the end of the URL.

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
