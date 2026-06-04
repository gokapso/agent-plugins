# Appointment Booking Agent Example

Use this example prompt after installing the plugin:

```text
Build a Kapso WhatsApp appointment booking agent that asks for preferred time, confirms availability with a function, and falls back to a human when uncertain.
```

Expected Codex behavior:

- Use `automate-whatsapp` for workflow/function source.
- Use `validate-template` if outbound reminders are needed.
- Use `review-kapso-deploy` before deployment.
- Run `kapso push --dry-run` before asking for approval to push.
