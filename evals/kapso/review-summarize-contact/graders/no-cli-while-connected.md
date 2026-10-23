---
# The plugin's Setup rule (skills/*/SKILL.md) says to use the connected Kapso MCP tools
# for remote operations without a local CLI. Flip or drop this check if Kapso makes
# the CLI the preferred path for plugin users.
type: tool_used
tool: Bash
input_match: 'kapso\s'
min: 0
max: 0
---
