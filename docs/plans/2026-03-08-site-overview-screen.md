# Site Overview Screen

## Problem

Landing on a site defaults to the Tasks screen. If you don't use tasks, you get an empty state. Sites need a generic home screen.

## Design

### Location

- New "Overview" nav item at top of site nav list (above Sync)
- Default route: `/sites/:id` redirects to `/sites/:id/overview` instead of `/sites/:id/tasks`
- Route name: `site-overview`

### Layout

Centered vertically and horizontally in the detail pane. No cards, no panels — just content floating in space.

### Content (top to bottom)

1. **Quick actions** — Row of 3 buttons:
   - Open site (opens localhost URL)
   - WP Admin (opens /wp-admin)
   - Start/Stop site

2. **Site info** — Small muted line: PHP version, WP version

3. **Recent activity** — Simple list, 5-6 items max:
   - Task completions, syncs, site starts/stops
   - Each item: icon + description + relative timestamp
   - Empty state: "No recent activity"

### What it doesn't do

- Doesn't repeat sidebar info (URL, credentials, local path, thumbnail)
- No cards, panels, or widgets
- No charts or metrics

### Navigation

- Icon: `home` or `layout` from @wordpress/icons
- Sits above Sync in the sidebar nav list
- Clicking any other nav item or task navigates away from overview
