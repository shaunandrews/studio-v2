---
name: worktree-stop
description: Clean up a worktree session. Kills the dev server, releases the port, and exits the worktree. Use when done with isolated branch work.
---

# Worktree Cleanup

Tear down a worktree dev session cleanly.

## Steps

1. **Find and kill the dev server.** Check which port the worktree server is running on and kill it:
   ```bash
   kill $(lsof -ti:<port>) 2>/dev/null
   ```
   If unsure of the port, check running node processes or ask the user.

2. **Release the port.** Free the Port Keeper reservation:
   ```bash
   portman release <port> --json
   ```

3. **Exit the worktree.** Use ExitWorktree. Default to `action: "keep"` to preserve the branch. Only use `"remove"` if the user explicitly says to delete it.

## Notes

- Always kill the server BEFORE exiting the worktree, otherwise the process lingers.
- If the user says "clean up" or "tear it down" — they mean keep the branch but stop everything. Only delete the worktree if they say "delete", "nuke", or "remove".
