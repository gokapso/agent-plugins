# WhatsApp Support Agent Example

Use this example prompt after installing the plugin:

```text
Build a Kapso WhatsApp support agent that answers common questions, escalates uncertain cases to a human, waits, and resumes with the human answer.
```

Expected Codex behavior:

- Use `automate-whatsapp`.
- Create or adapt workflow source with `@kapso/workflows`.
- Add function source following the Kapso handler contract.
- Run `kapso build`.
- Run `kapso push --dry-run`.
- Ask before any real `kapso push`.
