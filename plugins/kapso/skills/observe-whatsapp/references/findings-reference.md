# Findings MCP Reference

Use the Kapso MCP `findings` tool for recurring Project Event patterns and the
project Findings inbox. Use Logs for operational records such as API calls,
webhook deliveries, Meta events, and workflow execution events. Use Project
Events for the underlying durable event records and event definitions.

## Actions

The tool is grouped: pass the action in `action` and action-specific inputs in
`params`.

| Action | Parameters | Purpose | Approval |
| --- | --- | --- | --- |
| `help` | none | Return supported actions and usage | No |
| `list` | optional `limit` | List visible project Findings | No |
| `get` | `finding_id` | Read one authoritative Finding | No |
| `read_evidence` | `finding_id` | Read bounded evidence for one Finding | No |
| `start_investigation` | `finding_id` | Start or retry the specialized investigation | Yes |
| `dismiss` | `finding_id`, `reason`, `note` | Dismiss a Finding with an attributed explanation | Yes |
| `mark_addressed` | `finding_id` | Start verification monitoring after the Finding is addressed | Yes |

`list` returns at most 25 Findings. Check the response metadata for
`returned_count` and `truncated`.

## Read workflow

For a new recurring-problem request:

1. List Findings with `limit: 25`.
2. Use `get` for the selected Finding instead of relying only on the compact list summary.
3. Use `read_evidence` before stating a cause or recommending a workflow change.
4. Correlate the evidence with Logs, workflow executions, or Project Events when the Finding points to a specific operational incident.

Example calls:

```json
{
  "action": "list",
  "params": { "limit": 25 }
}
```

```json
{
  "action": "get",
  "params": { "finding_id": "finding-uuid" }
}
```

```json
{
  "action": "read_evidence",
  "params": { "finding_id": "finding-uuid" }
}
```

Evidence is bounded and can include source events, affected and comparison
conversations, co-occurring evidence, coverage information, related Findings,
and links back to the project. It is evidence for investigation, not an
automatic causal conclusion.

## Lifecycle actions

### Start an investigation

Ask the user for approval before calling:

```json
{
  "action": "start_investigation",
  "params": { "finding_id": "finding-uuid" }
}
```

The response identifies the queued investigation. Follow the returned next
step, or call `get` again, to inspect the investigation result when it is
available. If an investigation is already running or is not retryable, report
that state instead of creating duplicates.

### Dismiss a Finding

Ask for approval and an explanatory note before calling `dismiss`:

```json
{
  "action": "dismiss",
  "params": {
    "finding_id": "finding-uuid",
    "reason": "expected_behavior",
    "note": "This pattern is intentional for the current support workflow."
  }
}
```

Allowed reasons are:

- `not_relevant`
- `expected_behavior`
- `already_fixed`
- `incorrect`
- `other`

Do not dismiss a Finding without a concrete reason and note. The MCP request
identity is attributed to the dismissal.

### Mark a Finding addressed

Only use `mark_addressed` after a completed investigation covers the Finding's
current evidence. Ask for approval before calling:

```json
{
  "action": "mark_addressed",
  "params": { "finding_id": "finding-uuid" }
}
```

This starts verification monitoring against future evidence. It does not
resolve the Finding immediately. Report the returned monitoring status and
re-check the Finding with `get` after the action.
