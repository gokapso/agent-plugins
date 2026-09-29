# Agent Remote Sandbox

Use the remote sandbox when an agent node needs a disposable workspace to inspect or modify repository files during execution.

## What sandbox access changes

When `sandbox_enabled` is `true`, the agent gets a remote ephemeral workspace plus sandbox file tools:

- `bash`
- `read`
- `list_dir`
- `write`
- `edit`

Repository resources are separate from tool definitions. They are mounted into the sandbox only when sandbox access is enabled.

If sandbox access is later turned off, the repository resources stay saved in the node config. They are simply not mounted until sandbox access is enabled again.

Remote sandbox is in beta. Sandbox usage is free during the beta. Pricing may change later.

## GitHub repository resources

v1 supports GitHub repositories only.

Each repository entry in `flow_agent_resources` should include:

```json
{
  "resource_type": "github_repository",
  "repo_url": "https://github.com/org/repo",
  "branch": "main",
  "auth_type": "public"
}
```

Rules:
- Use a repository root URL only
- Valid examples: `https://github.com/org/repo`, `https://github.com/org/repo.git`, `git@github.com:org/repo.git`
- Do not use GitHub file URLs, subdirectory URLs, or `tree/...` URLs
- Choose `auth_type: "public"` for public repositories (no credentials; clears stored authentication).
- For private repositories, use `auth_type: "pat"` with `pat`, or `auth_type: "github_app"` with `github_app_installation_id` from an active project connection that grants repository access.
- Saved responses omit credentials and return metadata such as `auth_type`, `has_pat`, `has_github_app`, and `github_app_installation_id`. Never commit real PATs to workflow source.
- Imports or duplicates across projects do not carry App connections: `imported_missing_github_app: true` requires selecting a valid connection before execution.

## Mounted paths inside the sandbox

Configured repositories are cloned into:

```text
/workspace/repos/<repo-slug>
```

Write the agent prompt so it refers to those mounted paths explicitly. For example:

- inspect `/workspace/repos/acme-app` before answering
- read the README and relevant service files before proposing changes
- make changes only inside the mounted repository unless the workflow explicitly needs something else

## Sandbox network policy

Use `sandbox_network_mode` to control outbound access from the remote sandbox:

- `allow_all`: permit all outbound hosts
- `allow_list`: permit only allow-listed hosts

When GitHub repositories are attached, Kapso automatically adds the GitHub hosts needed for cloning and repository access. Add entries to `sandbox_allowed_outbound_hosts` only for extra services your workflow needs, such as internal APIs or external documentation hosts.

## Recommended setup flow

1. Pick a model with `node scripts/list-provider-models.js`
2. Start from `assets/agent-remote-sandbox-github-repo-example.json`
3. Enable `sandbox_enabled`
4. Add one or more GitHub repository resources
5. Choose `sandbox_network_mode`
6. If using `allow_list`, add only the extra hosts the agent truly needs
7. Validate with `node scripts/validate-graph.js --definition-file <path>`
8. Update the workflow graph
