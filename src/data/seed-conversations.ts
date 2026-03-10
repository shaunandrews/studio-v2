import type { Conversation, Message } from './types'

export const seedConversations: Conversation[] = [
  // All Sites
  { id: 'all-sites-updates', siteId: '__all-sites__', agentId: 'wpcom', title: 'Update WordPress across all sites', createdAt: '2026-02-28T10:00:00Z' },
  { id: 'all-sites-plugins', siteId: '__all-sites__', agentId: 'wpcom', title: 'Plugin compatibility check', createdAt: '2026-03-01T14:00:00Z' },

  // Global (home screen)
  { id: 'global-1', siteId: null, agentId: 'wpcom', title: 'Getting started', createdAt: '2026-02-10T08:00:00Z' },

  // Shaun's Blog
  { id: 'blog-assistant-1', siteId: 'shauns-blog', agentId: 'wpcom', title: 'Hero section redesign', createdAt: '2026-02-12T10:00:00Z' },
  { id: 'blog-code-1', siteId: 'shauns-blog', agentId: 'wpcom', title: 'Custom block development', createdAt: '2026-02-11T14:00:00Z' },

  // Downstreet Café
  { id: 'cafe-onboarding', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Setting up Downstreet Café', createdAt: '2025-11-15T10:00:00Z' },
  { id: 'cafe-hero-tweak', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Homepage hero updates', createdAt: '2025-11-18T09:00:00Z' },
  { id: 'cafe-photos', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Menu photo updates', createdAt: '2025-11-22T14:00:00Z' },
  { id: 'cafe-reservations', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Online reservations', createdAt: '2025-12-03T11:00:00Z' },
  { id: 'cafe-seo', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'SEO & analytics setup', createdAt: '2025-12-10T10:00:00Z' },
  { id: 'cafe-events', siteId: 'downstreet-cafe', agentId: 'wpcom', title: 'Events page', createdAt: '2026-01-08T13:00:00Z' },

  // Studio Meridian
  { id: 'portfolio-onboarding', siteId: 'portfolio', agentId: 'wpcom', title: 'Setting up Studio Meridian', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'portfolio-assistant-1', siteId: 'portfolio', agentId: 'wpcom', title: 'Adding Meridian × Oura case study', createdAt: '2026-02-15T14:00:00Z' },

  // Flavor Records
  { id: 'records-design-1', siteId: 'flavor-records', agentId: 'wpcom', title: 'Album grid layout', createdAt: '2026-02-05T13:00:00Z' },

  // Mise en Place
  { id: 'mise-assistant-1', siteId: 'mise-en-place', agentId: 'wpcom', title: 'Recipe card layout', createdAt: '2026-02-08T11:30:00Z' },

  // Ledger
  { id: 'ledger-assistant-1', siteId: 'ledger', agentId: 'wpcom', title: 'Invoice template', createdAt: '2026-02-10T09:30:00Z' },
  { id: 'ledger-code-1', siteId: 'ledger', agentId: 'wpcom', title: 'Payment status API', createdAt: '2026-02-11T10:00:00Z' },

  // Fuego Collective
  { id: 'fuego-assistant-1', siteId: 'fuego-collective', agentId: 'wpcom', title: 'Setting up the shop', createdAt: '2026-02-14T12:30:00Z' },
]

export const seedMessages: Message[] = [
  // ═══════════════════════════════════════════
  // Global conversation — no tool calls, just chat
  // ═══════════════════════════════════════════
  { id: 'g1-1', conversationId: 'global-1', role: 'agent', agentId: 'wpcom', content: "Hey! I'm Kit. I can build sites, customize themes, install plugins, write code — you name it. Pick a site from the sidebar or tell me what you want to create.", timestamp: '2026-02-10T08:00:00Z' },
  { id: 'g1-2', conversationId: 'global-1', role: 'user', content: 'I want to create a new site for a record label.', timestamp: '2026-02-10T08:01:00Z' },
  { id: 'g1-3', conversationId: 'global-1', role: 'agent', agentId: 'wpcom', content: 'A record label — nice. I\'ll set up a new project called "Flavor Records" with a starter theme that works well for music and media. Give me a sec…', timestamp: '2026-02-10T08:01:30Z' },

  // ═══════════════════════════════════════════
  // Shaun's Blog — hero section redesign
  // ═══════════════════════════════════════════
  { id: 'ba1-1', conversationId: 'blog-assistant-1', role: 'user', content: 'I want to change the hero section on my homepage to have a gradient background and bigger text.', timestamp: '2026-02-12T10:00:00Z' },
  { id: 'ba1-2', conversationId: 'blog-assistant-1', role: 'agent', agentId: 'wpcom', content: "I'll update your hero with a gradient and bump the heading size. One moment.", timestamp: '2026-02-12T10:00:30Z' },
  {
    id: 'ba1-3', conversationId: 'blog-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "Done — gradient is a subtle blue-to-purple, heading is 64px now (up from 48px), subheading is 20px. Take a look at the preview.",
    toolCalls: [
      { id: 'tc-ba1-1', label: 'Updated hero background to gradient', status: 'done', toolName: 'edit_theme', args: 'section: "hero", background: "linear-gradient(135deg, #667eea, #764ba2)"' },
      { id: 'tc-ba1-2', label: 'Increased heading and subheading sizes', status: 'done', toolName: 'update_styles', args: 'h1: "64px", subtitle: "20px"' },
    ],
    timestamp: '2026-02-12T10:01:00Z',
  },
  { id: 'ba1-4', conversationId: 'blog-assistant-1', role: 'user', content: "Love the gradient! But can you make the text white so it's easier to read?", timestamp: '2026-02-12T10:02:00Z' },
  {
    id: 'ba1-5', conversationId: 'blog-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "All hero text is white now with a subtle text shadow for contrast. Should be much easier to read.",
    toolCalls: [
      { id: 'tc-ba1-3', label: 'Set hero text to white with text shadow', status: 'done', toolName: 'update_styles', args: 'color: "#fff", text-shadow: "0 1px 3px rgba(0,0,0,0.3)"' },
    ],
    timestamp: '2026-02-12T10:02:30Z',
  },

  // ═══════════════════════════════════════════
  // Shaun's Blog — custom block development
  // ═══════════════════════════════════════════
  { id: 'bc1-1', conversationId: 'blog-code-1', role: 'user', content: "I need a custom 'project showcase' block that displays a grid of portfolio items with images and descriptions.", timestamp: '2026-02-11T14:00:00Z' },
  { id: 'bc1-2', conversationId: 'blog-code-1', role: 'agent', agentId: 'wpcom', content: "I'll scaffold a custom block called `project-showcase` — `block.json` registration, `InnerBlocks` for flexible card content, and a responsive CSS Grid layout. Let me generate the files.", timestamp: '2026-02-11T14:00:30Z' },
  {
    id: 'bc1-3', conversationId: 'blog-code-1', role: 'agent', agentId: 'wpcom',
    content: "The block is registered and ready to use in the editor. It supports 2, 3, or 4 column layouts from the block toolbar. Each card uses `InnerBlocks` so you can drop in images, headings, text — whatever you need.",
    toolCalls: [
      { id: 'tc-bc1-1', label: 'Created block.json with attributes', status: 'done', toolName: 'create_file', args: 'path: "blocks/project-showcase/block.json"' },
      { id: 'tc-bc1-2', label: 'Generated edit component with InnerBlocks', status: 'done', toolName: 'create_file', args: 'path: "blocks/project-showcase/edit.tsx"' },
      { id: 'tc-bc1-3', label: 'Generated save component with grid layout', status: 'done', toolName: 'create_file', args: 'path: "blocks/project-showcase/save.tsx"' },
      { id: 'tc-bc1-4', label: 'Added responsive grid styles', status: 'done', toolName: 'create_file', args: 'path: "blocks/project-showcase/style.css"' },
      { id: 'tc-bc1-5', label: 'Registered block in plugin', status: 'done', toolName: 'edit_file', args: 'path: "plugin.php"', result: 'Block registered via register_block_type()' },
    ],
    timestamp: '2026-02-11T14:01:30Z',
  },

  // ═══════════════════════════════════════════
  // Downstreet Café — onboarding (Q&A then build)
  // ═══════════════════════════════════════════
  { id: 'co-1', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "Hi! I'm Kit, your AI assistant.", timestamp: '2025-11-15T10:00:00Z' },
  { id: 'co-2', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "I can design and build just about anything — stores, blogs, portfolios, apps. Just describe what you want and I'll make it happen.", timestamp: '2025-11-15T10:00:10Z' },
  { id: 'co-3', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "So, what are we making?", timestamp: '2025-11-15T10:00:15Z' },
  { id: 'co-4', conversationId: 'cafe-onboarding', role: 'user', content: "Restaurant", timestamp: '2025-11-15T10:00:30Z' },
  { id: 'co-5', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "Nice — what's the restaurant called?", timestamp: '2025-11-15T10:00:35Z' },
  { id: 'co-6', conversationId: 'cafe-onboarding', role: 'user', content: "Downstreet Café", timestamp: '2025-11-15T10:01:00Z' },
  { id: 'co-7', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "Describe it in a sentence. What kind of food, what's the vibe?", timestamp: '2025-11-15T10:01:05Z' },
  { id: 'co-8', conversationId: 'cafe-onboarding', role: 'user', content: "A warm neighborhood café in Portland, Maine. Specialty coffee, fresh pastries, and a community hub — been open since 2018.", timestamp: '2025-11-15T10:01:40Z' },
  { id: 'co-9', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "How do you want the site to look and feel? Any vibe, mood, or style you have in mind?", timestamp: '2025-11-15T10:01:45Z' },
  { id: 'co-10', conversationId: 'cafe-onboarding', role: 'user', content: "Warm and editorial, like a well-designed indie coffee shop zine. Serif headings, earthy tones, nothing flashy.", timestamp: '2025-11-15T10:02:20Z' },
  { id: 'co-11', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "Are there any sites you really like, or want to use as inspiration?", timestamp: '2025-11-15T10:02:25Z' },
  { id: 'co-12', conversationId: 'cafe-onboarding', role: 'user', content: "bluebottlecoffee.com", timestamp: '2025-11-15T10:02:45Z' },
  { id: 'co-13', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "Let me design **Downstreet Café** for you. I'll create a few design directions to choose from.", timestamp: '2025-11-15T10:02:50Z' },
  { id: 'co-14', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "Crafting design briefs…", timestamp: '2025-11-15T10:02:55Z' },
  { id: 'co-15', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "Here are 3 directions for **Downstreet Café**. Pick the one that feels right:", timestamp: '2025-11-15T10:03:40Z' },
  { id: 'co-16', conversationId: 'cafe-onboarding', role: 'user', content: "Warm Editorial", timestamp: '2025-11-15T10:04:10Z' },
  { id: 'co-17', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "**Warm Editorial** — great choice. Inviting editorial warmth with serif headings and a muted earthy palette. Playfair Display + Source Sans Pro. Building it now.", timestamp: '2025-11-15T10:04:15Z' },
  {
    id: 'co-18', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom',
    content: "",
    toolCalls: [
      { id: 'tc-co-1', label: 'Built Home — Header', status: 'done', toolName: 'create_section', args: 'page: "home", section: "header"' },
      { id: 'tc-co-2', label: 'Built Home — Hero', status: 'done', toolName: 'create_section', args: 'page: "home", section: "hero"' },
      { id: 'tc-co-3', label: 'Built Home — Menu Preview', status: 'done', toolName: 'create_section', args: 'page: "home", section: "menu-preview"' },
      { id: 'tc-co-4', label: 'Built Home — Community', status: 'done', toolName: 'create_section', args: 'page: "home", section: "community"' },
      { id: 'tc-co-5', label: 'Built Home — Footer', status: 'done', toolName: 'create_section', args: 'page: "home", section: "footer"' },
      { id: 'tc-co-6', label: 'Built Menu — Header', status: 'done', toolName: 'create_section', args: 'page: "menu", section: "header"' },
      { id: 'tc-co-7', label: 'Built Menu — Full Menu', status: 'done', toolName: 'create_section', args: 'page: "menu", section: "full-menu"' },
      { id: 'tc-co-8', label: 'Built Menu — Footer', status: 'done', toolName: 'create_section', args: 'page: "menu", section: "footer"' },
      { id: 'tc-co-9', label: 'Built About — Header', status: 'done', toolName: 'create_section', args: 'page: "about", section: "header"' },
      { id: 'tc-co-10', label: 'Built About — Story & Team', status: 'done', toolName: 'create_section', args: 'page: "about", section: "content"' },
      { id: 'tc-co-11', label: 'Built About — Footer', status: 'done', toolName: 'create_section', args: 'page: "about", section: "footer"' },
    ],
    timestamp: '2025-11-15T10:04:20Z',
  },
  { id: 'co-19', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'wpcom', content: "**Downstreet Café** is ready! 3 pages, 11 sections. Take a look and let me know if you want to tweak anything.", timestamp: '2025-11-15T10:06:00Z' },

  // ═══════════════════════════════════════════
  // Downstreet Café — homepage hero tweak
  // ═══════════════════════════════════════════
  { id: 'ch-1', conversationId: 'cafe-hero-tweak', role: 'user', content: "The hero tagline says \"Coffee crafted with intention\" which is fine, but I want to add our actual hours underneath it. Mon–Fri 7am–5pm, Weekends 8am–6pm.", timestamp: '2025-11-18T09:00:00Z' },
  { id: 'ch-2', conversationId: 'cafe-hero-tweak', role: 'agent', agentId: 'wpcom', content: "I'll add the hours below the tagline — smaller text, slightly muted so they don't compete with the headline. Also, want me to change the headline? You mentioned it feels a bit pretentious.", timestamp: '2025-11-18T09:00:30Z' },
  { id: 'ch-3', conversationId: 'cafe-hero-tweak', role: 'user', content: "Yeah, change it to \"Your neighborhood coffee shop\" — much more us.", timestamp: '2025-11-18T09:01:15Z' },
  {
    id: 'ch-4', conversationId: 'cafe-hero-tweak', role: 'agent', agentId: 'wpcom',
    content: "Done. The headline is warmer now and the hours sit underneath in a secondary color at a smaller size. Much more Downstreet.",
    toolCalls: [
      { id: 'tc-ch-1', label: 'Updated headline to "Your neighborhood coffee shop"', status: 'done', toolName: 'edit_content', args: 'page: "home", block: "hero-heading"' },
      { id: 'tc-ch-2', label: 'Added hours display below tagline', status: 'done', toolName: 'add_block', args: 'page: "home", after: "hero-tagline", type: "paragraph"' },
      { id: 'tc-ch-3', label: 'Styled hours in muted secondary text', status: 'done', toolName: 'update_styles', args: 'font-size: "14px", color: "secondary"' },
    ],
    timestamp: '2025-11-18T09:01:45Z',
  },

  // ═══════════════════════════════════════════
  // Downstreet Café — menu photo updates
  // ═══════════════════════════════════════════
  { id: 'cp-1', conversationId: 'cafe-photos', role: 'user', content: "The menu page still has placeholder images. I've got real photos now — can you swap them in? I'll upload them to the media library.", timestamp: '2025-11-22T14:00:00Z' },
  { id: 'cp-2', conversationId: 'cafe-photos', role: 'agent', agentId: 'wpcom', content: "Go for it — upload them and I'll place them. Are these for specific menu sections, or more general food photography?", timestamp: '2025-11-22T14:00:30Z' },
  { id: 'cp-3', conversationId: 'cafe-photos', role: 'user', content: "Both. Hero shots for each of the three menu sections (coffee, pastries, lunch) plus individual item photos for the featured items on the homepage.", timestamp: '2025-11-22T14:01:15Z' },
  {
    id: 'cp-4', conversationId: 'cafe-photos', role: 'agent', agentId: 'wpcom',
    content: "All photos are placed. Section heroes at the top of each menu category, featured items updated on the homepage. Everything's converted to WebP with responsive srcset for fast mobile loading.",
    toolCalls: [
      { id: 'tc-cp-1', label: 'Added coffee section hero image', status: 'done', toolName: 'replace_image', args: 'page: "menu", section: "coffee"' },
      { id: 'tc-cp-2', label: 'Added pastries section hero image', status: 'done', toolName: 'replace_image', args: 'page: "menu", section: "pastries"' },
      { id: 'tc-cp-3', label: 'Added lunch section hero image', status: 'done', toolName: 'replace_image', args: 'page: "menu", section: "lunch"' },
      { id: 'tc-cp-4', label: 'Updated homepage featured items with photos', status: 'done', toolName: 'replace_image', args: 'page: "home", section: "featured-items"', result: '4 images replaced' },
      { id: 'tc-cp-5', label: 'Optimized all images for web', status: 'done', toolName: 'optimize_media', args: 'format: "webp", srcset: true', result: '7 images converted, avg 68% smaller' },
    ],
    timestamp: '2025-11-22T14:02:00Z',
  },
  { id: 'cp-5', conversationId: 'cafe-photos', role: 'user', content: "Looks great. The lavender latte photo is a little dark though — can you bump the brightness?", timestamp: '2025-11-22T14:03:00Z' },
  {
    id: 'cp-6', conversationId: 'cafe-photos', role: 'agent', agentId: 'wpcom',
    content: "Brightened it up with a slight exposure boost and warmed the white balance so the lavender color reads better.",
    toolCalls: [
      { id: 'tc-cp-6', label: 'Adjusted brightness and white balance on lavender latte', status: 'done', toolName: 'edit_image', args: 'exposure: "+0.3", warmth: "+5"' },
    ],
    timestamp: '2025-11-22T14:03:30Z',
  },

  // ═══════════════════════════════════════════
  // Downstreet Café — online reservations
  // ═══════════════════════════════════════════
  { id: 'cr-1', conversationId: 'cafe-reservations', role: 'user', content: "We want to start taking table reservations online. What's the best way to do that?", timestamp: '2025-12-03T11:00:00Z' },
  { id: 'cr-2', conversationId: 'cafe-reservations', role: 'agent', agentId: 'wpcom', content: "For a café your size, I'd go with **Simply Schedule Appointments**. It's lightweight, handles time slots well, and sends email confirmations automatically. I can set up slots matching your hours with 30-minute blocks and a max party size. Want me to install it?", timestamp: '2025-12-03T11:00:30Z' },
  { id: 'cr-3', conversationId: 'cafe-reservations', role: 'user', content: "Yeah, do it. Max 4 people per reservation, and block off the last hour of each day for walk-ins only.", timestamp: '2025-12-03T11:01:15Z' },
  {
    id: 'cr-4', conversationId: 'cafe-reservations', role: 'agent', agentId: 'wpcom',
    content: "All set. Last hour of each day is blocked off for walk-ins. There's a new Reservations page linked from the header. Customers get an email confirmation, you get a notification too.",
    toolCalls: [
      { id: 'tc-cr-1', label: 'Installed Simply Schedule Appointments', status: 'done', toolName: 'install_plugin', args: 'slug: "simply-schedule-appointments"', result: 'v1.6.8 installed and activated' },
      { id: 'tc-cr-2', label: 'Created weekday slots (7am–4pm, 30-min blocks)', status: 'done', toolName: 'configure_schedule', args: 'days: "mon-fri", start: "7:00", end: "16:00", interval: 30' },
      { id: 'tc-cr-3', label: 'Created weekend slots (8am–5pm, 30-min blocks)', status: 'done', toolName: 'configure_schedule', args: 'days: "sat-sun", start: "8:00", end: "17:00", interval: 30' },
      { id: 'tc-cr-4', label: 'Set max party size to 4', status: 'done', toolName: 'configure_schedule', args: 'max_party: 4' },
      { id: 'tc-cr-5', label: 'Created Reservations page with booking form', status: 'done', toolName: 'create_page', args: 'title: "Reservations", slug: "/reservations"' },
      { id: 'tc-cr-6', label: 'Added "Reserve a Table" to header navigation', status: 'done', toolName: 'update_navigation', args: 'menu: "primary", label: "Reserve a Table", url: "/reservations"' },
    ],
    timestamp: '2025-12-03T11:02:00Z',
  },
  { id: 'cr-5', conversationId: 'cafe-reservations', role: 'user', content: "Can we also add a note field so people can mention allergies or special requests?", timestamp: '2025-12-03T11:03:00Z' },
  {
    id: 'cr-6', conversationId: 'cafe-reservations', role: 'agent', agentId: 'wpcom',
    content: "Done — optional \"Special requests\" textarea on the form. Shows up in both the confirmation email and your admin notification. Kept it optional so it doesn't slow down bookings.",
    toolCalls: [
      { id: 'tc-cr-7', label: 'Added optional "Special requests" field to booking form', status: 'done', toolName: 'edit_form', args: 'form: "reservation", field: "textarea", label: "Special requests"' },
    ],
    timestamp: '2025-12-03T11:03:30Z',
  },

  // ═══════════════════════════════════════════
  // Downstreet Café — SEO & analytics
  // ═══════════════════════════════════════════
  { id: 'cs-1', conversationId: 'cafe-seo', role: 'user', content: 'I want us to show up when people search "coffee shop Portland Maine." And I need some kind of analytics to see how many people visit the site.', timestamp: '2025-12-10T10:00:00Z' },
  { id: 'cs-2', conversationId: 'cafe-seo', role: 'agent', agentId: 'wpcom', content: "Jetpack handles both. **SEO tools** for meta titles, descriptions, and sitemaps. **Jetpack Stats** for visitor analytics right in your dashboard — no Google account needed. I'll also add structured data so Google shows your address and hours in search results.", timestamp: '2025-12-10T10:00:30Z' },
  { id: 'cs-3', conversationId: 'cafe-seo', role: 'user', content: "Yep, go ahead.", timestamp: '2025-12-10T10:01:00Z' },
  {
    id: 'cs-4', conversationId: 'cafe-seo', role: 'agent', agentId: 'wpcom',
    content: "Jetpack is live. Stats will start showing visitor data right away. All pages have meta descriptions and your business info is in the structured data — 142 Downstreet Ave, Portland ME 04101, hours, phone number. Sitemap is at `/sitemap_index.xml`.",
    toolCalls: [
      { id: 'tc-cs-1', label: 'Installed and connected Jetpack', status: 'done', toolName: 'install_plugin', args: 'slug: "jetpack"', result: 'Jetpack 14.3 installed and activated' },
      { id: 'tc-cs-2', label: 'Enabled Jetpack Stats', status: 'done', toolName: 'configure_module', args: 'module: "stats", enabled: true' },
      { id: 'tc-cs-3', label: 'Enabled SEO tools and Open Graph', status: 'done', toolName: 'configure_module', args: 'module: "seo-tools", og_tags: true' },
      { id: 'tc-cs-4', label: 'Added LocalBusiness schema markup', status: 'done', toolName: 'edit_theme_functions', args: 'Added wp_head action with JSON-LD schema' },
      { id: 'tc-cs-5', label: 'Set meta descriptions for all pages', status: 'done', toolName: 'update_meta', args: 'Updated 5 pages: Home, Menu, About, Reservations, Events' },
      { id: 'tc-cs-6', label: 'Generated XML sitemap', status: 'done', toolName: 'generate_sitemap', result: '/sitemap_index.xml (5 URLs)' },
    ],
    timestamp: '2025-12-10T10:01:30Z',
  },
  { id: 'cs-5', conversationId: 'cafe-seo', role: 'user', content: "Should I also set up a Google Business Profile?", timestamp: '2025-12-10T10:02:30Z' },
  { id: 'cs-6', conversationId: 'cafe-seo', role: 'agent', agentId: 'wpcom', content: "Absolutely — that's the single biggest thing for local search. Claim your listing at business.google.com, add your hours, photos, and menu link. The schema markup I just added will sync with it so Google shows rich results. I can't create the listing for you (Google requires account verification), but everything on the WordPress side is ready.", timestamp: '2025-12-10T10:03:00Z' },

  // ═══════════════════════════════════════════
  // Downstreet Café — events page
  // ═══════════════════════════════════════════
  { id: 'ce-1', conversationId: 'cafe-events', role: 'user', content: "I want a dedicated Events page. We do open mic nights, art shows, and coffee cupping workshops.", timestamp: '2026-01-08T13:00:00Z' },
  { id: 'ce-2', conversationId: 'cafe-events', role: 'agent', agentId: 'wpcom', content: "The homepage community section can tease upcoming events, but the full listing deserves its own page. Should I keep the homepage section as a \"what's next\" preview linking to the full Events page?", timestamp: '2026-01-08T13:00:30Z' },
  { id: 'ce-3', conversationId: 'cafe-events', role: 'user', content: "Keep it — just make it show the next 3 upcoming events and link to the full page for everything else.", timestamp: '2026-01-08T13:01:15Z' },
  {
    id: 'ce-4', conversationId: 'cafe-events', role: 'agent', agentId: 'wpcom',
    content: "Events page is live with all three event types listed. Each event shows date, time, description, and location. The homepage section now pulls the next 3 upcoming events dynamically with a \"View all events →\" link.",
    toolCalls: [
      { id: 'tc-ce-1', label: 'Created Events page with listing layout', status: 'done', toolName: 'create_page', args: 'title: "Events", slug: "/events", template: "listing"' },
      { id: 'tc-ce-2', label: 'Added event cards for open mic, art shows, workshops', status: 'done', toolName: 'create_posts', args: 'type: "event", count: 3', result: 'Open Mic Night, Art Show, Coffee Cupping' },
      { id: 'tc-ce-3', label: 'Updated homepage to show next 3 events', status: 'done', toolName: 'edit_content', args: 'page: "home", section: "community", query: "upcoming", limit: 3' },
      { id: 'tc-ce-4', label: 'Added "View all events" link to homepage', status: 'done', toolName: 'add_block', args: 'page: "home", type: "link", href: "/events"' },
      { id: 'tc-ce-5', label: 'Added Events to header navigation', status: 'done', toolName: 'update_navigation', args: 'menu: "primary", label: "Events", url: "/events"' },
    ],
    timestamp: '2026-01-08T13:02:00Z',
  },
  { id: 'ce-5', conversationId: 'cafe-events', role: 'user', content: "Love it. Can people RSVP to events?", timestamp: '2026-01-08T13:03:00Z' },
  { id: 'ce-6', conversationId: 'cafe-events', role: 'agent', agentId: 'wpcom', content: "Not yet, but since you already have Simply Schedule Appointments, I can add an RSVP form — name, email, party size — with confirmation emails. Want me to set that up?", timestamp: '2026-01-08T13:03:30Z' },
  { id: 'ce-7', conversationId: 'cafe-events', role: 'user', content: "That would be great, yeah.", timestamp: '2026-01-08T13:04:00Z' },
  {
    id: 'ce-8', conversationId: 'cafe-events', role: 'agent', agentId: 'wpcom',
    content: "Done — each event card has an \"RSVP\" button that opens a lightweight form. Confirmations go to both the guest and you, and there's a small attendee count badge on each event in the admin.",
    toolCalls: [
      { id: 'tc-ce-6', label: 'Added RSVP form to event cards', status: 'done', toolName: 'add_block', args: 'template: "event", type: "form", fields: ["name", "email", "party_size"]' },
      { id: 'tc-ce-7', label: 'Configured confirmation emails', status: 'done', toolName: 'configure_email', args: 'template: "rsvp-confirmation", recipients: ["guest", "admin"]' },
      { id: 'tc-ce-8', label: 'Added attendee count badge to admin', status: 'done', toolName: 'edit_file', args: 'path: "includes/event-admin.php"' },
    ],
    timestamp: '2026-01-08T13:04:30Z',
  },

  // ═══════════════════════════════════════════
  // Studio Meridian — onboarding (Q&A then build)
  // ═══════════════════════════════════════════
  { id: 'po-1', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "Hey! Kit here, ready when you are.", timestamp: '2026-01-20T09:00:00Z' },
  { id: 'po-2', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "I can design and build just about anything — stores, blogs, portfolios, apps. Describe what you want and I'll make it happen.", timestamp: '2026-01-20T09:00:10Z' },
  { id: 'po-3', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "So, what are we making?", timestamp: '2026-01-20T09:00:15Z' },
  { id: 'po-4', conversationId: 'portfolio-onboarding', role: 'user', content: "Portfolio", timestamp: '2026-01-20T09:00:30Z' },
  { id: 'po-5', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "Love it. What's your name, or what should we call the site?", timestamp: '2026-01-20T09:00:35Z' },
  { id: 'po-6', conversationId: 'portfolio-onboarding', role: 'user', content: "Studio Meridian", timestamp: '2026-01-20T09:01:00Z' },
  { id: 'po-7', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "In a sentence — what kind of work do you do?", timestamp: '2026-01-20T09:01:05Z' },
  { id: 'po-8', conversationId: 'portfolio-onboarding', role: 'user', content: "A design studio crafting digital experiences with precision, clarity, and human connection", timestamp: '2026-01-20T09:01:30Z' },
  { id: 'po-9', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "How do you want the site to look and feel?", timestamp: '2026-01-20T09:01:35Z' },
  { id: 'po-10', conversationId: 'portfolio-onboarding', role: 'user', content: "Swiss minimal — clean lines, lots of whitespace, precise typography. Think Dieter Rams meets the web.", timestamp: '2026-01-20T09:02:10Z' },
  { id: 'po-11', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "Any sites you really like for inspiration?", timestamp: '2026-01-20T09:02:15Z' },
  { id: 'po-12', conversationId: 'portfolio-onboarding', role: 'user', content: "linear.app, stripe.com, apple.com", timestamp: '2026-01-20T09:02:40Z' },
  { id: 'po-13', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "Let me design **Studio Meridian** for you. I'll create a few directions to choose from.", timestamp: '2026-01-20T09:02:45Z' },
  { id: 'po-14', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "Crafting design briefs…", timestamp: '2026-01-20T09:02:50Z' },
  { id: 'po-15', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "Here are 3 directions for **Studio Meridian**. Pick the one that feels right:", timestamp: '2026-01-20T09:03:30Z' },
  { id: 'po-16', conversationId: 'portfolio-onboarding', role: 'user', content: "Swiss Precision", timestamp: '2026-01-20T09:04:00Z' },
  { id: 'po-17', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "**Swiss Precision** — minimal, grid-driven layout with generous whitespace. Typography-led hierarchy using Inter. Monochrome palette with electric blue accent. Building it now.", timestamp: '2026-01-20T09:04:05Z' },
  {
    id: 'po-18', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom',
    content: "",
    toolCalls: [
      { id: 'tc-po-1', label: 'Built Home — Header', status: 'done', toolName: 'create_section', args: 'page: "home", section: "header"' },
      { id: 'tc-po-2', label: 'Built Home — Hero', status: 'done', toolName: 'create_section', args: 'page: "home", section: "hero"' },
      { id: 'tc-po-3', label: 'Built Home — Work Preview', status: 'done', toolName: 'create_section', args: 'page: "home", section: "work-preview"' },
      { id: 'tc-po-4', label: 'Built Home — Footer', status: 'done', toolName: 'create_section', args: 'page: "home", section: "footer"' },
      { id: 'tc-po-5', label: 'Built Work — Header', status: 'done', toolName: 'create_section', args: 'page: "work", section: "header"' },
      { id: 'tc-po-6', label: 'Built Work — Project Grid', status: 'done', toolName: 'create_section', args: 'page: "work", section: "grid"' },
      { id: 'tc-po-7', label: 'Built Work — Footer', status: 'done', toolName: 'create_section', args: 'page: "work", section: "footer"' },
      { id: 'tc-po-8', label: 'Built About — Header', status: 'done', toolName: 'create_section', args: 'page: "about", section: "header"' },
      { id: 'tc-po-9', label: 'Built About — Bio & Philosophy', status: 'done', toolName: 'create_section', args: 'page: "about", section: "content"' },
      { id: 'tc-po-10', label: 'Built About — Footer', status: 'done', toolName: 'create_section', args: 'page: "about", section: "footer"' },
    ],
    timestamp: '2026-01-20T09:04:10Z',
  },
  { id: 'po-19', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'wpcom', content: "**Studio Meridian** is ready! 3 pages, 10 sections. Take a look.", timestamp: '2026-01-20T09:06:00Z' },

  // ═══════════════════════════════════════════
  // Studio Meridian — case study
  // ═══════════════════════════════════════════
  { id: 'pa1-1', conversationId: 'portfolio-assistant-1', role: 'user', content: "I want to add a case study for a recent project — a brand identity we did for Oura.", timestamp: '2026-02-15T14:00:00Z' },
  { id: 'pa1-2', conversationId: 'portfolio-assistant-1', role: 'agent', agentId: 'wpcom', content: "Great project to showcase. Full breakdown with brief, process, and outcome — or just the highlights?", timestamp: '2026-02-15T14:00:30Z' },
  { id: 'pa1-3', conversationId: 'portfolio-assistant-1', role: 'user', content: "Full breakdown. Hero image with the ring on a dark background, then sections for the brief, our process, and the final deliverables. Keep the Swiss minimal feel.", timestamp: '2026-02-15T14:01:15Z' },
  {
    id: 'pa1-4', conversationId: 'portfolio-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "The Oura case study is live. Full-bleed dark hero for the product photography, then alternating light sections for brief, process, and deliverables. It's linked from the Work grid too.",
    toolCalls: [
      { id: 'tc-pa-1', label: 'Created case study page template', status: 'done', toolName: 'create_page', args: 'title: "Oura — Brand Identity", slug: "/work/oura"' },
      { id: 'tc-pa-2', label: 'Added full-bleed dark hero section', status: 'done', toolName: 'create_section', args: 'page: "work/oura", section: "hero", background: "dark"' },
      { id: 'tc-pa-3', label: 'Built brief, process, and deliverables sections', status: 'done', toolName: 'create_section', args: 'page: "work/oura", sections: ["brief", "process", "deliverables"]' },
      { id: 'tc-pa-4', label: 'Linked from Work grid', status: 'done', toolName: 'edit_content', args: 'page: "work", section: "grid"', result: 'Added Oura card to project grid' },
    ],
    timestamp: '2026-02-15T14:02:00Z',
  },
  { id: 'pa1-5', conversationId: 'portfolio-assistant-1', role: 'user', content: "Looks great. Can you add a \"Next project\" link at the bottom that goes to the Stripe case study?", timestamp: '2026-02-15T14:03:00Z' },
  {
    id: 'pa1-6', conversationId: 'portfolio-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "Done — \"Next Project\" bar at the bottom with a preview thumbnail and title. I've added it to all case study pages so visitors can browse through your work sequentially.",
    toolCalls: [
      { id: 'tc-pa-5', label: 'Added "Next Project" navigation to all case studies', status: 'done', toolName: 'create_section', args: 'template: "case-study", section: "next-project"', result: 'Sequential linking across all case studies' },
    ],
    timestamp: '2026-02-15T14:03:30Z',
  },

  // ═══════════════════════════════════════════
  // Flavor Records — design discussion (no tool calls)
  // ═══════════════════════════════════════════
  { id: 'rd1-1', conversationId: 'records-design-1', role: 'user', content: 'Think vinyl-era nostalgia meets modern minimal. Dark backgrounds, bold type, album art as the hero element.', timestamp: '2026-02-05T13:00:00Z' },
  { id: 'rd1-2', conversationId: 'records-design-1', role: 'agent', agentId: 'wpcom', content: 'Love it. I\'m thinking off-black (#1A1A1A) background, warm white (#F5F0EB) text, and a large album grid as the homepage centerpiece. Heavy sans-serif for headings — that punchy label feel. Let me draft the layout.', timestamp: '2026-02-05T13:01:00Z' },
  { id: 'rd1-3', conversationId: 'records-design-1', role: 'agent', agentId: 'wpcom', content: "Here's the palette I've put together:\n\n**Color Palette**\n- Charcoal: #1A1A1A\n- Parchment: #F5F0EB\n- Electric Red: #E63946\n- Slate: #2A2A2A\n- Muted: #999999\n\nThe homepage leads with a featured release hero, then a grid of recent albums. Bold uppercase headings with weight 900. Check the preview — want to tweak anything?", timestamp: '2026-02-05T13:02:00Z' },

  // ═══════════════════════════════════════════
  // Mise en Place — recipe card layout
  // ═══════════════════════════════════════════
  { id: 'ma1-1', conversationId: 'mise-assistant-1', role: 'user', content: 'The recipe cards on the dashboard need a better layout. I want to show cook time and difficulty more prominently.', timestamp: '2026-02-08T11:30:00Z' },
  {
    id: 'ma1-2', conversationId: 'mise-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "Redesigned the recipe cards — cook time and difficulty now sit in a meta bar at the bottom with subtle icons, and the cuisine tag is a pill badge overlaying the image. Cards also have a hover lift effect now. Take a look.",
    toolCalls: [
      { id: 'tc-ma-1', label: 'Updated card layout with bottom meta bar', status: 'done', toolName: 'edit_template', args: 'template: "recipe-card", section: "meta"' },
      { id: 'tc-ma-2', label: 'Added cook time and difficulty icons', status: 'done', toolName: 'add_block', args: 'template: "recipe-card", type: "icon-meta"', result: 'Clock icon + difficulty dots' },
      { id: 'tc-ma-3', label: 'Added cuisine pill badge on image', status: 'done', toolName: 'update_styles', args: 'element: ".cuisine-tag", position: "overlay", style: "pill"' },
    ],
    timestamp: '2026-02-08T11:31:30Z',
  },

  // ═══════════════════════════════════════════
  // Ledger — invoice template
  // ═══════════════════════════════════════════
  { id: 'la1-1', conversationId: 'ledger-assistant-1', role: 'user', content: 'I need an invoice detail page. Should show line items, totals, and have buttons to send reminders or mark as paid.', timestamp: '2026-02-10T09:30:00Z' },
  {
    id: 'la1-2', conversationId: 'ledger-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "Invoice detail page is ready — clean two-column header (from/to), line items table with subtotal, tax, and total, plus action buttons for Send Reminder, Mark as Paid, and Download PDF. The status badge updates based on payment state.",
    toolCalls: [
      { id: 'tc-la-1', label: 'Created invoice page template', status: 'done', toolName: 'create_page', args: 'title: "Invoice Detail", slug: "/invoice"' },
      { id: 'tc-la-2', label: 'Added line items table with calculations', status: 'done', toolName: 'create_section', args: 'page: "invoice", section: "line-items"', result: 'Subtotal, tax rate, total calculated' },
      { id: 'tc-la-3', label: 'Added from/to header and status badge', status: 'done', toolName: 'create_section', args: 'page: "invoice", section: "header"' },
      { id: 'tc-la-4', label: 'Added action buttons (Send, Mark Paid, PDF)', status: 'done', toolName: 'add_block', args: 'page: "invoice", type: "button-group"' },
    ],
    timestamp: '2026-02-10T09:31:30Z',
  },

  // ═══════════════════════════════════════════
  // Ledger — payment status API
  // ═══════════════════════════════════════════
  { id: 'lc1-1', conversationId: 'ledger-code-1', role: 'user', content: 'I need a REST endpoint that returns invoice status — paid, pending, or overdue based on the due date.', timestamp: '2026-02-11T10:00:00Z' },
  {
    id: 'lc1-2', conversationId: 'ledger-code-1', role: 'agent', agentId: 'wpcom',
    content: "The endpoint is live at `GET /api/invoices/:id/status`. Returns `{ status: 'paid' | 'pending' | 'overdue', daysUntilDue: number, amountDue: number }`. Overdue is calculated automatically from the due date. Want me to add webhook notifications for status changes?",
    toolCalls: [
      { id: 'tc-lc-1', label: 'Created invoice status model', status: 'done', toolName: 'create_file', args: 'path: "models/invoice-status.php"' },
      { id: 'tc-lc-2', label: 'Added GET /api/invoices/:id/status route', status: 'done', toolName: 'create_file', args: 'path: "routes/invoice-status.php"' },
      { id: 'tc-lc-3', label: 'Implemented overdue detection logic', status: 'done', toolName: 'edit_file', args: 'path: "models/invoice-status.php"', result: 'Compares due_date against current date' },
      { id: 'tc-lc-4', label: 'Added response schema validation', status: 'done', toolName: 'edit_file', args: 'path: "routes/invoice-status.php"', result: 'Validates status, daysUntilDue, amountDue fields' },
    ],
    timestamp: '2026-02-11T10:01:30Z',
  },

  // ═══════════════════════════════════════════
  // Fuego Collective — shop setup (includes ERROR)
  // ═══════════════════════════════════════════
  { id: 'fc1-1', conversationId: 'fuego-assistant-1', role: 'user', content: 'I need product pages for each sauce, a shop page, and checkout. We have 8 sauces ranging from mild to "sign a waiver" hot.', timestamp: '2026-02-14T12:30:00Z' },
  { id: 'fc1-2', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'wpcom', content: "Let me get WooCommerce set up with your shop, checkout, and payment processing. Then we'll add the sauces.", timestamp: '2026-02-14T12:30:30Z' },
  {
    id: 'fc1-3', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "WooCommerce is installed and shipping is configured for glass bottles, but I couldn't connect Stripe — you'll need to add your API key in **WooCommerce → Settings → Payments** first. Once that's done, I can finish the payment setup.",
    toolCalls: [
      { id: 'tc-fc-1', label: 'Installed WooCommerce', status: 'done', toolName: 'install_plugin', args: 'slug: "woocommerce"', result: 'WooCommerce 9.5.1 installed and activated' },
      { id: 'tc-fc-2', label: 'Created Shop, Cart, and Checkout pages', status: 'done', toolName: 'create_pages', args: 'pages: ["Shop", "Cart", "Checkout"]' },
      { id: 'tc-fc-3', label: 'Failed to connect Stripe — API key not configured', status: 'error', toolName: 'configure_payments', args: 'gateway: "stripe"', error: 'STRIPE_API_KEY not found in environment' },
      { id: 'tc-fc-4', label: 'Configured shipping for glass bottles', status: 'done', toolName: 'configure_shipping', args: 'fragile: true, weight_based: true' },
    ],
    timestamp: '2026-02-14T12:31:30Z',
  },
  { id: 'fc1-4', conversationId: 'fuego-assistant-1', role: 'user', content: "I'll add the Stripe key later. Start with Smoky Habanero — it's our flagship. $14, 5oz bottle. Then add the rest. And I want a heat level rating on each product page.", timestamp: '2026-02-14T12:32:30Z' },
  {
    id: 'fc1-5', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "Smoky Habanero is up — $14, 5oz, with Scoville rating, ingredient list, and suggested pairings. I've added a custom \"Heat Level\" field that shows a \u{1F336}\u{FE0F} scale from 1-5 on every product page. Adding the rest of the lineup now.",
    toolCalls: [
      { id: 'tc-fc-5', label: 'Created "Smoky Habanero" product', status: 'done', toolName: 'create_product', args: 'name: "Smoky Habanero", price: 14.00, weight: "5oz"' },
      { id: 'tc-fc-6', label: 'Added custom Heat Level field via ACF', status: 'done', toolName: 'install_plugin', args: 'slug: "advanced-custom-fields"' },
      { id: 'tc-fc-7', label: 'Created heat level display (1-5 scale)', status: 'done', toolName: 'edit_template', args: 'template: "single-product", field: "heat_level"' },
    ],
    timestamp: '2026-02-14T12:33:30Z',
  },
  { id: 'fc1-6', conversationId: 'fuego-assistant-1', role: 'user', content: "Can we also set up a subscription box? Monthly hot sauce club — 3 bottles for $36.", timestamp: '2026-02-14T12:34:30Z' },
  {
    id: 'fc1-7', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'wpcom',
    content: "All 8 sauces are live with heat ratings, and the \"Fuego Club\" subscription is set up — $36/month for 3 rotating bottles with free shipping for subscribers.",
    toolCalls: [
      { id: 'tc-fc-8', label: 'Added remaining 7 sauce products', status: 'done', toolName: 'create_product', args: 'count: 7, prices: "$12-$18"', result: 'All products have heat levels, ingredients, pairings' },
      { id: 'tc-fc-9', label: 'Installed WooCommerce Subscriptions', status: 'done', toolName: 'install_plugin', args: 'slug: "woocommerce-subscriptions"' },
      { id: 'tc-fc-10', label: 'Created "Fuego Club" subscription product', status: 'done', toolName: 'create_product', args: 'name: "Fuego Club", type: "subscription", price: "$36/month"', result: '3 rotating bottles, free shipping' },
    ],
    timestamp: '2026-02-14T12:35:30Z',
  },

  // ═══════════════════════════════════════════
  // All Sites — WordPress updates
  // ═══════════════════════════════════════════
  { id: 'as1-1', conversationId: 'all-sites-updates', role: 'user', content: 'Can you check which sites need WordPress updates?', timestamp: '2026-02-28T10:00:00Z' },
  {
    id: 'as1-2', conversationId: 'all-sites-updates', role: 'agent', agentId: 'wpcom',
    content: "**Downstreet Café** — WordPress 7.0-beta2 (latest)\n**Studio Meridian** — WordPress 6.7.1 (update available: 7.0-beta2)\n\nWant me to update Studio Meridian?",
    toolCalls: [
      { id: 'tc-as1-1', label: 'Checked WordPress versions across all sites', status: 'done', toolName: 'check_versions', result: '1 site needs update' },
    ],
    timestamp: '2026-02-28T10:00:30Z',
  },
  { id: 'as1-3', conversationId: 'all-sites-updates', role: 'user', content: 'Yes, update it.', timestamp: '2026-02-28T10:01:00Z' },
  {
    id: 'as1-4', conversationId: 'all-sites-updates', role: 'agent', agentId: 'wpcom',
    content: "Done. Studio Meridian is now on WordPress 7.0-beta2. Both sites are on the same version.",
    toolCalls: [
      { id: 'tc-as1-2', label: 'Updated Studio Meridian to WordPress 7.0-beta2', status: 'done', toolName: 'update_wordpress', args: 'site: "portfolio", version: "7.0-beta2"' },
    ],
    timestamp: '2026-02-28T10:01:30Z',
  },

  // ═══════════════════════════════════════════
  // All Sites — Plugin compatibility check
  // ═══════════════════════════════════════════
  { id: 'as2-1', conversationId: 'all-sites-plugins', role: 'user', content: 'Are any of my plugins outdated across my sites?', timestamp: '2026-03-01T14:00:00Z' },
  {
    id: 'as2-2', conversationId: 'all-sites-plugins', role: 'agent', agentId: 'wpcom',
    content: "**Downstreet Café** (4 plugins)\n- Jetpack 14.2 → 14.3 available\n- WooCommerce 9.5.1 (up to date)\n- Akismet 5.3.4 (up to date)\n- Reservations Plugin 1.0.0 (custom, no updates)\n\n**Studio Meridian** (2 plugins)\n- Jetpack 14.1 → 14.3 available\n- Yoast SEO 24.1 (up to date)\n\nJetpack needs updating on both sites. Want me to update them?",
    toolCalls: [
      { id: 'tc-as2-1', label: 'Scanned plugins across all sites', status: 'done', toolName: 'scan_plugins', result: '6 plugins checked, 2 updates available' },
    ],
    timestamp: '2026-03-01T14:00:30Z',
  },
]
