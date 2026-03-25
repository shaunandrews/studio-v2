---
name: worktree-dev
description: Enter a worktree and start a dev server. Handles port allocation, .env symlinking, and server startup in one step. Use when starting isolated branch work.
---

# Worktree Dev Setup

Spin up an isolated worktree with a running dev server. One command, zero friction.

## Steps

1. **Enter the worktree.** Use EnterWorktree with the name provided by the user (or derive one from the task).

2. **Symlink .env.** The main repo's `.env` is gitignored and won't exist in the worktree. Symlink it:
   ```bash
   ln -s /Users/shaun/Developer/Projects/studio-v2/.env .env
   ```

3. **Request a port.** Use Port Keeper to get a free port:
   ```bash
   portman request 1 -n "studio-v2-<worktree-name>" --json
   ```
   Parse the port number from the JSON response.

4. **Start the dev server.** Run in the background:
   ```bash
   PORT=<port> npm run dev
   ```
   Wait a few seconds and verify it responds with a quick curl.

5. **Report the URL.** Tell the user: `Running at http://localhost:<port>`

## Notes

- The main repo runs on port 3025. Never use that port for a worktree.
- The Vite HMR websocket port conflict warning is harmless — ignore it.
- If the user provides a branch name, use it as the worktree name.
