import type { Conversation, Message } from './types'

export const seedConversations: Conversation[] = [
  // All Sites
  { id: 'all-sites-updates', siteId: '__all-sites__', agentId: 'assistant', title: 'Update WordPress across all sites', createdAt: '2026-02-28T10:00:00Z' },
  { id: 'all-sites-plugins', siteId: '__all-sites__', agentId: 'assistant', title: 'Plugin compatibility check', createdAt: '2026-03-01T14:00:00Z' },

  // Global (home screen)
  { id: 'global-1', siteId: null, agentId: 'assistant', title: 'Getting started', createdAt: '2026-02-10T08:00:00Z' },

  // Shaun's Blog
  { id: 'blog-assistant-1', siteId: 'shauns-blog', agentId: 'assistant', title: 'Hero section redesign', createdAt: '2026-02-12T10:00:00Z' },
  { id: 'blog-code-1', siteId: 'shauns-blog', agentId: 'code', title: 'Custom block development', createdAt: '2026-02-11T14:00:00Z' },

  // Downstreet Café
  { id: 'cafe-onboarding', siteId: 'downstreet-cafe', agentId: 'assistant', title: 'Setting up Downstreet Café', createdAt: '2025-11-15T10:00:00Z' },
  { id: 'cafe-hero-tweak', siteId: 'downstreet-cafe', agentId: 'assistant', title: 'Homepage hero updates', createdAt: '2025-11-18T09:00:00Z' },
  { id: 'cafe-photos', siteId: 'downstreet-cafe', agentId: 'assistant', title: 'Menu photo updates', createdAt: '2025-11-22T14:00:00Z' },
  { id: 'cafe-reservations', siteId: 'downstreet-cafe', agentId: 'assistant', title: 'Online reservations', createdAt: '2025-12-03T11:00:00Z' },
  { id: 'cafe-seo', siteId: 'downstreet-cafe', agentId: 'assistant', title: 'SEO & analytics setup', createdAt: '2025-12-10T10:00:00Z' },
  { id: 'cafe-events', siteId: 'downstreet-cafe', agentId: 'assistant', title: 'Events page', createdAt: '2026-01-08T13:00:00Z' },

  // Studio Meridian
  { id: 'portfolio-onboarding', siteId: 'portfolio', agentId: 'assistant', title: 'Setting up Studio Meridian', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'portfolio-assistant-1', siteId: 'portfolio', agentId: 'assistant', title: 'Adding Meridian × Oura case study', createdAt: '2026-02-15T14:00:00Z' },

  // Flavor Records
  { id: 'records-design-1', siteId: 'flavor-records', agentId: 'design', title: 'Album grid layout', createdAt: '2026-02-05T13:00:00Z' },

  // Mise en Place
  { id: 'mise-assistant-1', siteId: 'mise-en-place', agentId: 'assistant', title: 'Recipe card layout', createdAt: '2026-02-08T11:30:00Z' },

  // Ledger
  { id: 'ledger-assistant-1', siteId: 'ledger', agentId: 'assistant', title: 'Invoice template', createdAt: '2026-02-10T09:30:00Z' },
  { id: 'ledger-code-1', siteId: 'ledger', agentId: 'code', title: 'Payment status API', createdAt: '2026-02-11T10:00:00Z' },

  // Fuego Collective
  { id: 'fuego-assistant-1', siteId: 'fuego-collective', agentId: 'assistant', title: 'Setting up the shop', createdAt: '2026-02-14T12:30:00Z' },
]

export const seedMessages: Message[] = [
  // Global conversation
  { id: 'g1-1', conversationId: 'global-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Welcome to WordPress Studio! I can help you create a new project, or you can select an existing one from the sidebar. What would you like to do?" }], timestamp: '2026-02-10T08:00:00Z' },
  { id: 'g1-2', conversationId: 'global-1', role: 'user', content: [{ type: 'text', text: 'I want to create a new site for a record label.' }], timestamp: '2026-02-10T08:01:00Z', messageContext: { source: 'typed' } },
  { id: 'g1-3', conversationId: 'global-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: 'Great idea! I\'ll set up a new WordPress project called "Flavor Records." I\'ll pick a starter theme that works well for music and media sites. Give me just a moment…' }], timestamp: '2026-02-10T08:01:30Z' },

  // Shaun's Blog — assistant
  { id: 'ba1-1', conversationId: 'blog-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Hello! I'm your site assistant. I can help you build, customize, and manage your WordPress site. What would you like to work on?" }], timestamp: '2026-02-12T10:00:00Z' },
  { id: 'ba1-2', conversationId: 'blog-assistant-1', role: 'user', content: [{ type: 'text', text: 'I want to change the hero section on my homepage to have a gradient background and bigger text.' }], timestamp: '2026-02-12T10:01:00Z', messageContext: { source: 'typed' } },
  { id: 'ba1-3', conversationId: 'blog-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "I'll update your hero section with a gradient background and increase the heading size. Let me make those changes to your theme now." }], timestamp: '2026-02-12T10:01:30Z' },
  { id: 'ba1-4', conversationId: 'blog-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Done! I've applied a subtle blue-to-purple gradient to the hero background and bumped the heading from 48px to 64px. The subheading is now 20px. Take a look at the preview — does that feel right?" }], timestamp: '2026-02-12T10:02:00Z' },
  { id: 'ba1-5', conversationId: 'blog-assistant-1', role: 'user', content: [{ type: 'text', text: "Love the gradient! But can you make the text white so it's easier to read?" }], timestamp: '2026-02-12T10:03:00Z', messageContext: { source: 'typed' } },
  { id: 'ba1-6', conversationId: 'blog-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Of course — I've set all hero text to white with a subtle text shadow for extra contrast. The preview should update in a moment." }], timestamp: '2026-02-12T10:03:30Z' },

  // Shaun's Blog — code
  { id: 'bc1-1', conversationId: 'blog-code-1', role: 'agent', agentId: 'code', content: [{ type: 'text', text: "I'm the code agent. I can help you write custom blocks, modify theme templates, or debug PHP/JS issues. What are we building?" }], timestamp: '2026-02-11T14:00:00Z' },
  { id: 'bc1-2', conversationId: 'blog-code-1', role: 'user', content: [{ type: 'text', text: "I need a custom 'project showcase' block that displays a grid of portfolio items with images and descriptions." }], timestamp: '2026-02-11T14:01:00Z', messageContext: { source: 'typed' } },
  { id: 'bc1-3', conversationId: 'blog-code-1', role: 'agent', agentId: 'code', content: [{ type: 'text', text: "I'll scaffold a custom block called `project-showcase`. It'll register with `block.json`, use `InnerBlocks` for each project card, and render as a responsive CSS Grid. Let me generate the files." }], timestamp: '2026-02-11T14:01:30Z' },
  { id: 'bc1-4', conversationId: 'blog-code-1', role: 'agent', agentId: 'code', content: [
    { type: 'card', card: 'progress', data: { label: 'Scaffolding project-showcase block', steps: [
      { name: 'Created block.json with attributes', status: 'done' },
      { name: 'Generated edit.tsx with InnerBlocks', status: 'done' },
      { name: 'Generated save.tsx with grid layout', status: 'done' },
      { name: 'Added block styles (CSS Grid)', status: 'done' },
      { name: 'Registered block in plugin', status: 'done' },
    ] } },
    { type: 'text', text: "All set. The block is registered and ready to use in the editor. It supports 2, 3, or 4 column layouts — you can pick from the block toolbar. Each card inside uses `InnerBlocks` so you can add images, headings, and text freely." },
  ], timestamp: '2026-02-11T14:02:30Z' },

  // Downstreet Café — onboarding (full flow)
  { id: 'co-1', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Hi! I'm Kit, your AI assistant." }], timestamp: '2025-11-15T10:00:00Z' },
  { id: 'co-2', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "I can design and build just about anything. I can make stores, blogs, portfolios, apps, you name it. Just describe what you want and I'll make it happen." }], timestamp: '2025-11-15T10:00:10Z' },
  { id: 'co-3', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "So, what are we making?" }], timestamp: '2025-11-15T10:00:15Z' },
  { id: 'co-4', conversationId: 'cafe-onboarding', role: 'user', content: [{ type: 'text', text: "Restaurant" }], timestamp: '2025-11-15T10:00:30Z', messageContext: { source: 'action' } },
  { id: 'co-5', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Nice\u2014what's the restaurant called?" }], timestamp: '2025-11-15T10:00:35Z' },
  { id: 'co-6', conversationId: 'cafe-onboarding', role: 'user', content: [{ type: 'text', text: "Downstreet Caf\u00e9" }], timestamp: '2025-11-15T10:01:00Z', messageContext: { source: 'typed' } },
  { id: 'co-7', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Describe it in a sentence. What kind of food, what's the vibe?" }], timestamp: '2025-11-15T10:01:05Z' },
  { id: 'co-8', conversationId: 'cafe-onboarding', role: 'user', content: [{ type: 'text', text: "A warm neighborhood caf\u00e9 in Portland, Maine. Specialty coffee, fresh pastries, and a community hub \u2014 been open since 2018." }], timestamp: '2025-11-15T10:01:40Z', messageContext: { source: 'typed' } },
  { id: 'co-9', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "How do you want the site to look and feel? Any vibe, mood, or style you have in mind?" }], timestamp: '2025-11-15T10:01:45Z' },
  { id: 'co-10', conversationId: 'cafe-onboarding', role: 'user', content: [{ type: 'text', text: "Warm and editorial, like a well-designed indie coffee shop zine. Serif headings, earthy tones, nothing flashy." }], timestamp: '2025-11-15T10:02:20Z', messageContext: { source: 'typed' } },
  { id: 'co-11', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Are there any sites you really like, or want to use as inspiration?" }], timestamp: '2025-11-15T10:02:25Z' },
  { id: 'co-12', conversationId: 'cafe-onboarding', role: 'user', content: [{ type: 'text', text: "bluebottlecoffee.com" }], timestamp: '2025-11-15T10:02:45Z', messageContext: { source: 'typed' } },
  { id: 'co-13', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Let me design **Downstreet Caf\u00e9** for you. I'll create a few design directions for you to choose from." }], timestamp: '2025-11-15T10:02:50Z' },
  { id: 'co-14', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Crafting design briefs\u2026" }], timestamp: '2025-11-15T10:02:55Z' },
  { id: 'co-15', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Here are 3 directions for **Downstreet Caf\u00e9**. Pick the one that feels right:" }], timestamp: '2025-11-15T10:03:40Z' },
  { id: 'co-16', conversationId: 'cafe-onboarding', role: 'user', content: [{ type: 'text', text: "Warm Editorial" }], timestamp: '2025-11-15T10:04:10Z', messageContext: { source: 'action' } },
  { id: 'co-17', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "**Warm Editorial** — Inviting editorial warmth with serif headings and a muted earthy palette. Playfair Display + Source Sans Pro." }], timestamp: '2025-11-15T10:04:15Z' },
  { id: 'co-18', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [
    { type: 'text', text: "Great choice! Building **Downstreet Caf\u00e9** \u2014 11 sections across 3 pages." },
    { type: 'card', card: 'progress', data: { label: 'Build Progress', steps: [
      { name: 'Home \u2014 Header', status: 'done' },
      { name: 'Home \u2014 Hero', status: 'done' },
      { name: 'Home \u2014 Menu Preview', status: 'done' },
      { name: 'Home \u2014 Community', status: 'done' },
      { name: 'Home \u2014 Footer', status: 'done' },
      { name: 'Menu \u2014 Header', status: 'done' },
      { name: 'Menu \u2014 Full Menu', status: 'done' },
      { name: 'Menu \u2014 Footer', status: 'done' },
      { name: 'About \u2014 Header', status: 'done' },
      { name: 'About \u2014 About Content', status: 'done' },
      { name: 'About \u2014 Footer', status: 'done' },
    ] } },
  ], timestamp: '2025-11-15T10:04:20Z' },
  { id: 'co-19', conversationId: 'cafe-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "**Downstreet Caf\u00e9** is ready! Take a look and let me know if you want to tweak anything." }], timestamp: '2025-11-15T10:06:00Z' },

  // Downstreet Café — homepage hero tweak
  { id: 'ch-1', conversationId: 'cafe-hero-tweak', role: 'user', content: [{ type: 'text', text: "The hero tagline says \"Coffee crafted with intention\" which is fine, but I want to add our actual hours underneath it. Mon\u2013Fri 7am\u20135pm, Weekends 8am\u20136pm." }], timestamp: '2025-11-18T09:00:00Z', messageContext: { source: 'typed' } },
  { id: 'ch-2', conversationId: 'cafe-hero-tweak', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "I'll add the hours below the tagline. Want them styled subtly \u2014 smaller text, slightly muted \u2014 so they don't compete with the headline?" }], timestamp: '2025-11-18T09:00:30Z' },
  { id: 'ch-3', conversationId: 'cafe-hero-tweak', role: 'user', content: [{ type: 'text', text: "Yeah, subtle is good. And while you're at it, change the headline to \"Your neighborhood coffee shop\" \u2014 the \"crafted with intention\" thing feels a bit pretentious." }], timestamp: '2025-11-18T09:01:15Z', messageContext: { source: 'typed' } },
  { id: 'ch-4', conversationId: 'cafe-hero-tweak', role: 'agent', agentId: 'assistant', content: [
    { type: 'card', card: 'progress', data: { label: 'Updating hero section', steps: [
      { name: 'Updated headline to "Your neighborhood coffee shop"', status: 'done' },
      { name: 'Added hours display below tagline', status: 'done' },
      { name: 'Styled hours in muted secondary text', status: 'done' },
    ] } },
    { type: 'text', text: "Done. The headline is warmer now and the hours sit underneath in the secondary color at a smaller size. Honest and straightforward \u2014 much more Downstreet." },
  ], timestamp: '2025-11-18T09:01:45Z' },

  // Downstreet Café — menu photo updates
  { id: 'cp-1', conversationId: 'cafe-photos', role: 'user', content: [{ type: 'text', text: "The menu page still has placeholder images. I've got real photos now \u2014 can you swap them in? I'll upload them to the media library." }], timestamp: '2025-11-22T14:00:00Z', messageContext: { source: 'typed' } },
  { id: 'cp-2', conversationId: 'cafe-photos', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Go for it \u2014 upload them and I'll place them. Are these photos for specific items, or more general food photography for the section headers?" }], timestamp: '2025-11-22T14:00:30Z' },
  { id: 'cp-3', conversationId: 'cafe-photos', role: 'user', content: [{ type: 'text', text: "Both. I've got hero shots for each of the three menu sections (coffee, pastries, lunch) plus a few individual item photos for the featured items on the homepage." }], timestamp: '2025-11-22T14:01:15Z', messageContext: { source: 'typed' } },
  { id: 'cp-4', conversationId: 'cafe-photos', role: 'agent', agentId: 'assistant', content: [
    { type: 'card', card: 'progress', data: { label: 'Updating menu photography', steps: [
      { name: 'Added coffee section hero image', status: 'done' },
      { name: 'Added pastries section hero image', status: 'done' },
      { name: 'Added lunch section hero image', status: 'done' },
      { name: 'Updated homepage featured items with individual photos', status: 'done' },
      { name: 'Optimized images for web (WebP, responsive srcset)', status: 'done' },
    ] } },
    { type: 'text', text: "All photos are in. I\u2019ve placed the section heroes at the top of each menu category and updated the four featured items on the homepage. Everything\u2019s been converted to WebP with responsive srcset so they load fast on mobile too." },
  ], timestamp: '2025-11-22T14:02:00Z' },
  { id: 'cp-5', conversationId: 'cafe-photos', role: 'user', content: [{ type: 'text', text: "Looks great. The lavender latte photo is a little dark though \u2014 can you bump the brightness on that one?" }], timestamp: '2025-11-22T14:03:00Z', messageContext: { source: 'typed' } },
  { id: 'cp-6', conversationId: 'cafe-photos', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Brightened it up \u2014 added a slight exposure boost and warmed the white balance a touch so the lavender color reads better. Check the homepage preview." }], timestamp: '2025-11-22T14:03:30Z' },

  // Downstreet Café — online reservations
  { id: 'cr-1', conversationId: 'cafe-reservations', role: 'user', content: [{ type: 'text', text: "We want to start taking table reservations online. What's the best way to do that in WordPress?" }], timestamp: '2025-12-03T11:00:00Z', messageContext: { source: 'typed' } },
  { id: 'cr-2', conversationId: 'cafe-reservations', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "For a caf\u00e9 your size, I\u2019d recommend **Simply Schedule Appointments**. It\u2019s lightweight, handles time slots well, and sends email confirmations automatically. I can set up slots matching your hours \u2014 Mon\u2013Fri 7am\u20135pm, Weekends 8am\u20136pm \u2014 with 30-minute blocks and a max party size. Want me to install it?" }], timestamp: '2025-12-03T11:00:30Z' },
  { id: 'cr-3', conversationId: 'cafe-reservations', role: 'user', content: [{ type: 'text', text: "Yeah, do it. Max 4 people per reservation, and block off the last hour of each day for walk-ins only." }], timestamp: '2025-12-03T11:01:15Z', messageContext: { source: 'typed' } },
  { id: 'cr-4', conversationId: 'cafe-reservations', role: 'agent', agentId: 'assistant', content: [
    { type: 'card', card: 'plugin', data: { name: 'Simply Schedule Appointments', slug: 'simply-schedule-appointments', description: 'Easy appointment booking with email confirmations, custom time slots, and calendar integration.', status: 'active' } },
    { type: 'card', card: 'progress', data: { label: 'Configuring reservations', steps: [
      { name: 'Installed Simply Schedule Appointments', status: 'done' },
      { name: 'Created weekday slots (7am\u20134pm, 30-min blocks)', status: 'done' },
      { name: 'Created weekend slots (8am\u20135pm, 30-min blocks)', status: 'done' },
      { name: 'Set max party size to 4', status: 'done' },
      { name: 'Added reservation form to new /reservations page', status: 'done' },
      { name: 'Added "Reserve a Table" link to header nav', status: 'done' },
    ] } },
    { type: 'text', text: "All set. Last hour of each day is blocked off for walk-ins. There\u2019s a new Reservations page linked from the header, and customers get an email confirmation with the date, time, and party size. You\u2019ll get a notification email too." },
  ], timestamp: '2025-12-03T11:02:00Z' },
  { id: 'cr-5', conversationId: 'cafe-reservations', role: 'user', content: [{ type: 'text', text: "Can we also add a note field so people can mention allergies or special requests?" }], timestamp: '2025-12-03T11:03:00Z', messageContext: { source: 'typed' } },
  { id: 'cr-6', conversationId: 'cafe-reservations', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Done \u2014 there's now an optional \"Special requests\" textarea on the form. It shows up in both the confirmation email and your admin notification. Kept it optional so it doesn\u2019t slow down the booking flow." }], timestamp: '2025-12-03T11:03:30Z' },

  // Downstreet Café — SEO & analytics
  { id: 'cs-1', conversationId: 'cafe-seo', role: 'user', content: [{ type: 'text', text: "I want us to show up when people search \"coffee shop Portland Maine.\" And I need some kind of analytics to see how many people visit the site." }], timestamp: '2025-12-10T10:00:00Z', messageContext: { source: 'typed' } },
  { id: 'cs-2', conversationId: 'cafe-seo', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Jetpack handles both of those. Its **SEO tools** give you meta titles, descriptions, and sitemaps, and **Jetpack Stats** gives you visitor analytics right in your WordPress dashboard \u2014 no Google account needed. I\u2019ll also add structured data for your business so Google shows your address and hours in search results. Sound good?" }], timestamp: '2025-12-10T10:00:30Z' },
  { id: 'cs-3', conversationId: 'cafe-seo', role: 'user', content: [{ type: 'text', text: "Yep, go ahead." }], timestamp: '2025-12-10T10:01:00Z', messageContext: { source: 'typed' } },
  { id: 'cs-4', conversationId: 'cafe-seo', role: 'agent', agentId: 'assistant', content: [
    { type: 'card', card: 'plugin', data: { name: 'Jetpack', slug: 'jetpack', description: 'Security, performance, and growth tools for WordPress. Includes SEO tools, Stats, site backups, and more.', status: 'active' } },
    { type: 'card', card: 'progress', data: { label: 'SEO & Analytics setup', steps: [
      { name: 'Installed and connected Jetpack', status: 'done' },
      { name: 'Enabled Jetpack Stats', status: 'done' },
      { name: 'Enabled SEO tools (meta titles, Open Graph, sitemaps)', status: 'done' },
      { name: 'Added LocalBusiness schema (name, address, hours, phone)', status: 'done' },
      { name: 'Set meta titles and descriptions for all pages', status: 'done' },
      { name: 'Generated XML sitemap', status: 'done' },
    ] } },
    { type: 'text', text: "Jetpack is live with Stats and SEO tools enabled. All pages have meta descriptions and your business info is in the structured data \u2014 142 Downstreet Ave, Portland ME 04101, hours, phone number. The sitemap is at /sitemap_index.xml. Stats will start showing visitor data in your dashboard right away \u2014 no extra accounts to set up." },
  ], timestamp: '2025-12-10T10:01:30Z' },
  { id: 'cs-5', conversationId: 'cafe-seo', role: 'user', content: [{ type: 'text', text: "Should I also set up a Google Business Profile?" }], timestamp: '2025-12-10T10:02:30Z', messageContext: { source: 'typed' } },
  { id: 'cs-6', conversationId: 'cafe-seo', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Absolutely \u2014 that\u2019s the single biggest thing for local search. Claim your listing at business.google.com, add your hours, photos, and menu link. The schema markup I just added will sync with it so Google shows rich results. I can\u2019t create the listing for you (Google requires account verification), but everything on the WordPress side is ready for it." }], timestamp: '2025-12-10T10:03:00Z' },

  // Downstreet Café — events page
  { id: 'ce-1', conversationId: 'cafe-events', role: 'user', content: [{ type: 'text', text: "The community events on the homepage are nice, but I want a dedicated Events page where we can list everything. We do open mic nights, art shows, and coffee cupping workshops." }], timestamp: '2026-01-08T13:00:00Z', messageContext: { source: 'typed' } },
  { id: 'ce-2', conversationId: 'cafe-events', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Makes sense \u2014 the homepage section can tease upcoming events but the full listing deserves its own page. Should I keep the homepage section as a \"what\u2019s next\" preview that links to the full Events page, or replace it entirely?" }], timestamp: '2026-01-08T13:00:30Z' },
  { id: 'ce-3', conversationId: 'cafe-events', role: 'user', content: [{ type: 'text', text: "Keep the homepage section \u2014 just make it show the next 3 upcoming events and link to the full page for everything else." }], timestamp: '2026-01-08T13:01:15Z', messageContext: { source: 'typed' } },
  { id: 'ce-4', conversationId: 'cafe-events', role: 'agent', agentId: 'assistant', content: [
    { type: 'card', card: 'progress', data: { label: 'Building Events page', steps: [
      { name: 'Created Events page with listing layout', status: 'done' },
      { name: 'Added event cards (date, title, description, time)', status: 'done' },
      { name: 'Updated homepage section to show next 3 events', status: 'done' },
      { name: 'Added "View all events" link to homepage section', status: 'done' },
      { name: 'Added Events to header navigation', status: 'done' },
    ] } },
    { type: 'card', card: 'page', data: { title: 'Events', slug: '/events', template: 'page', status: 'published', excerpt: 'Open mic nights, art exhibitions, coffee cupping workshops, and more at Downstreet Caf\u00e9.' } },
    { type: 'text', text: "The Events page is live with all three event types listed. Each event shows the date, time, a short description, and a location note (all at the caf\u00e9 for now). The homepage community section now pulls the next 3 upcoming events dynamically and has a \"View all events \u2192\" link at the bottom. It\u2019s in the header nav too." },
  ], timestamp: '2026-01-08T13:02:00Z' },
  { id: 'ce-5', conversationId: 'cafe-events', role: 'user', content: [{ type: 'text', text: "Love it. Can people RSVP to events?" }], timestamp: '2026-01-08T13:03:00Z', messageContext: { source: 'typed' } },
  { id: 'ce-6', conversationId: 'cafe-events', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Not yet, but I can add it. Since you already have Simply Schedule Appointments installed, I can create an RSVP form that collects name, email, and party size for each event. Attendees get a confirmation email and you get a headcount. Want me to set that up?" }], timestamp: '2026-01-08T13:03:30Z' },
  { id: 'ce-7', conversationId: 'cafe-events', role: 'user', content: [{ type: 'text', text: "That would be great, yeah." }], timestamp: '2026-01-08T13:04:00Z', messageContext: { source: 'typed' } },
  { id: 'ce-8', conversationId: 'cafe-events', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Done \u2014 each event card now has an \"RSVP\" button that opens a lightweight form. It captures name, email, and party size, then sends confirmations to both the guest and you. I\u2019ve added a small attendee count badge on each event so you can see interest at a glance from the admin." }], timestamp: '2026-01-08T13:04:30Z' },

  // UI Portfolio — onboarding (full flow)
  { id: 'po-1', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Hey! Kit here, ready when you are." }], timestamp: '2026-01-20T09:00:00Z' },
  { id: 'po-2', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "I can design and build just about anything. I can make stores, blogs, portfolios, apps, you name it. Just describe what you want and I'll make it happen." }], timestamp: '2026-01-20T09:00:10Z' },
  { id: 'po-3', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "So, what are we making?" }], timestamp: '2026-01-20T09:00:15Z' },
  { id: 'po-4', conversationId: 'portfolio-onboarding', role: 'user', content: [{ type: 'text', text: "Portfolio" }], timestamp: '2026-01-20T09:00:30Z', messageContext: { source: 'action' } },
  { id: 'po-5', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Love it. What's your name, or what should we call the site?" }], timestamp: '2026-01-20T09:00:35Z' },
  { id: 'po-6', conversationId: 'portfolio-onboarding', role: 'user', content: [{ type: 'text', text: "Studio Meridian" }], timestamp: '2026-01-20T09:01:00Z', messageContext: { source: 'typed' } },
  { id: 'po-7', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "In a sentence\u2014what kind of work do you do?" }], timestamp: '2026-01-20T09:01:05Z' },
  { id: 'po-8', conversationId: 'portfolio-onboarding', role: 'user', content: [{ type: 'text', text: "A design studio crafting digital experiences with precision, clarity, and human connection" }], timestamp: '2026-01-20T09:01:30Z', messageContext: { source: 'typed' } },
  { id: 'po-9', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "How do you want the site to look and feel? Any vibe, mood, or style you have in mind?" }], timestamp: '2026-01-20T09:01:35Z' },
  { id: 'po-10', conversationId: 'portfolio-onboarding', role: 'user', content: [{ type: 'text', text: "Swiss minimal \u2014 clean lines, lots of whitespace, precise typography. Think Dieter Rams meets the web." }], timestamp: '2026-01-20T09:02:10Z', messageContext: { source: 'typed' } },
  { id: 'po-11', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Are there any sites you really like, or want to use as inspiration?" }], timestamp: '2026-01-20T09:02:15Z' },
  { id: 'po-12', conversationId: 'portfolio-onboarding', role: 'user', content: [{ type: 'text', text: "linear.app, stripe.com, apple.com" }], timestamp: '2026-01-20T09:02:40Z', messageContext: { source: 'typed' } },
  { id: 'po-13', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Let me design **Studio Meridian** for you. I'll create a few design directions for you to choose from." }], timestamp: '2026-01-20T09:02:45Z' },
  { id: 'po-14', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Crafting design briefs\u2026" }], timestamp: '2026-01-20T09:02:50Z' },
  { id: 'po-15', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Here are 3 directions for **Studio Meridian**. Pick the one that feels right:" }], timestamp: '2026-01-20T09:03:30Z' },
  { id: 'po-16', conversationId: 'portfolio-onboarding', role: 'user', content: [{ type: 'text', text: "Swiss Precision" }], timestamp: '2026-01-20T09:04:00Z', messageContext: { source: 'action' } },
  { id: 'po-17', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "**Swiss Precision** — Minimal, grid-driven layout with generous whitespace. Typography-led hierarchy using Inter. Monochrome palette with electric blue accent." }], timestamp: '2026-01-20T09:04:05Z' },
  { id: 'po-18', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [
    { type: 'text', text: "Great choice! Building **Studio Meridian** \u2014 10 sections across 3 pages." },
    { type: 'card', card: 'progress', data: { label: 'Build Progress', steps: [
      { name: 'Home \u2014 Header', status: 'done' },
      { name: 'Home \u2014 Hero', status: 'done' },
      { name: 'Home \u2014 Work Preview', status: 'done' },
      { name: 'Home \u2014 Footer', status: 'done' },
      { name: 'Work \u2014 Header', status: 'done' },
      { name: 'Work \u2014 Work Grid', status: 'done' },
      { name: 'Work \u2014 Footer', status: 'done' },
      { name: 'About \u2014 Header', status: 'done' },
      { name: 'About \u2014 About Content', status: 'done' },
      { name: 'About \u2014 Footer', status: 'done' },
    ] } },
  ], timestamp: '2026-01-20T09:04:10Z' },
  { id: 'po-19', conversationId: 'portfolio-onboarding', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "**Studio Meridian** is ready! Take a look and let me know if you want to tweak anything." }], timestamp: '2026-01-20T09:06:00Z' },

  // UI Portfolio — case study conversation
  { id: 'pa1-1', conversationId: 'portfolio-assistant-1', role: 'user', content: [{ type: 'text', text: "I want to add a case study for a recent project \u2014 a brand identity we did for a smart ring company called Oura." }], timestamp: '2026-02-15T14:00:00Z', messageContext: { source: 'typed' } },
  { id: 'pa1-2', conversationId: 'portfolio-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Great project to showcase. I\u2019ll create a full case study page for the Oura work. What sections do you want \u2014 just the highlights, or the full breakdown with brief, process, and outcome?" }], timestamp: '2026-02-15T14:00:30Z' },
  { id: 'pa1-3', conversationId: 'portfolio-assistant-1', role: 'user', content: [{ type: 'text', text: "Full breakdown. Hero image with the ring on a dark background, then sections for the brief, our process, and the final deliverables. Keep the same Swiss minimal feel." }], timestamp: '2026-02-15T14:01:15Z', messageContext: { source: 'typed' } },
  { id: 'pa1-4', conversationId: 'portfolio-assistant-1', role: 'agent', agentId: 'assistant', content: [
    { type: 'card', card: 'progress', data: { label: 'Building Oura case study', steps: [
      { name: 'Created case study page template', status: 'done' },
      { name: 'Added hero section with dark background', status: 'done' },
      { name: 'Built brief, process, and outcome sections', status: 'done' },
      { name: 'Linked from Work grid', status: 'done' },
    ] } },
    { type: 'card', card: 'page', data: { title: 'Oura \u2014 Brand Identity', slug: '/work/oura', template: 'page', status: 'published', excerpt: 'A complete brand identity system for Oura\u2019s next-generation smart ring, from visual language to packaging.' } },
    { type: 'text', text: "The Oura case study is live. I\u2019ve used a full-bleed dark hero to let the product photography breathe, then alternating light sections for the brief, process, and deliverables. It\u2019s linked from the Work grid too. Take a look!" },
  ], timestamp: '2026-02-15T14:02:00Z' },
  { id: 'pa1-5', conversationId: 'portfolio-assistant-1', role: 'user', content: [{ type: 'text', text: "Looks great. Can you add a \u201CNext project\u201D link at the bottom that goes to the Stripe case study?" }], timestamp: '2026-02-15T14:03:00Z', messageContext: { source: 'typed' } },
  { id: 'pa1-6', conversationId: 'portfolio-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Done \u2014 there\u2019s now a \"Next Project\" bar at the bottom of the Oura page that links to the Stripe case study, with a preview thumbnail and title. I\u2019ve added it to all case study pages so visitors can browse through your work sequentially." }], timestamp: '2026-02-15T14:03:30Z' },

  // Flavor Records — design
  { id: 'rd1-1', conversationId: 'records-design-1', role: 'agent', agentId: 'design', content: [{ type: 'text', text: "Let's make this record label site look as good as the music sounds. What vibe are we going for?" }], timestamp: '2026-02-05T13:00:00Z' },
  { id: 'rd1-2', conversationId: 'records-design-1', role: 'user', content: [{ type: 'text', text: 'Think vinyl-era nostalgia meets modern minimal. Dark backgrounds, bold type, album art as the hero element.' }], timestamp: '2026-02-05T13:01:00Z', messageContext: { source: 'typed' } },
  { id: 'rd1-3', conversationId: 'records-design-1', role: 'agent', agentId: 'design', content: [{ type: 'text', text: 'Love it. I\'ll set up a dark theme with off-black (#1A1A1A), warm white (#F5F0EB) text, and a large album grid as the centerpiece of the homepage. Typography will be a heavy sans-serif for headings. Let me draft the layout.' }], timestamp: '2026-02-05T13:01:30Z' },
  { id: 'rd1-4', conversationId: 'records-design-1', role: 'agent', agentId: 'design', content: [
    { type: 'text', text: "Here's the palette I've put together:" },
    { type: 'card', card: 'colorPalette', data: { label: 'Color Palette', colors: [
      { name: 'Charcoal', hex: '#1A1A1A' },
      { name: 'Parchment', hex: '#F5F0EB' },
      { name: 'Electric Red', hex: '#E63946' },
      { name: 'Slate', hex: '#2A2A2A' },
      { name: 'Muted', hex: '#999999' },
    ] } },
    { type: 'text', text: "The homepage leads with a featured release hero, then a grid of recent albums. Bold uppercase headings with weight 900 for that punchy label feel. Check the preview — want to tweak anything?" },
  ], timestamp: '2026-02-05T13:02:30Z' },

  // Mise en Place — assistant
  { id: 'ma1-1', conversationId: 'mise-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Welcome to Mise en Place! I can help you build out your recipe app — pages, layouts, features. What are we cooking up?" }], timestamp: '2026-02-08T11:30:00Z' },
  { id: 'ma1-2', conversationId: 'mise-assistant-1', role: 'user', content: [{ type: 'text', text: 'The recipe cards on the dashboard need a better layout. I want to show the cook time and difficulty more prominently.' }], timestamp: '2026-02-08T11:31:00Z', messageContext: { source: 'typed' } },
  { id: 'ma1-3', conversationId: 'mise-assistant-1', role: 'agent', agentId: 'assistant', content: [
    { type: 'text', text: "I've redesigned the recipe cards. Cook time and difficulty now sit in a meta bar at the bottom of each card with subtle icons, and the cuisine tag is a pill badge overlaying the image. The cards also have a hover lift effect now." },
    { type: 'text', text: "Take a look at the preview. Want me to adjust the spacing or try a different arrangement?" },
  ], timestamp: '2026-02-08T11:32:00Z' },

  // Ledger — assistant
  { id: 'la1-1', conversationId: 'ledger-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Ledger is ready to go. I can help you set up invoice templates, client management, or the dashboard. Where should we start?" }], timestamp: '2026-02-10T09:30:00Z' },
  { id: 'la1-2', conversationId: 'ledger-assistant-1', role: 'user', content: [{ type: 'text', text: 'I need an invoice detail page. Should show line items, totals, and have buttons to send reminders or mark as paid.' }], timestamp: '2026-02-10T09:31:00Z', messageContext: { source: 'typed' } },
  { id: 'la1-3', conversationId: 'ledger-assistant-1', role: 'agent', agentId: 'assistant', content: [
    { type: 'text', text: "Done. I've built the invoice detail page with a clean two-column header (from/to), a line items table with subtotal, tax, and total, plus action buttons for Send Reminder, Mark as Paid, and Download PDF." },
    { type: 'card', card: 'page', data: { title: 'Invoice Detail', slug: '/invoice', template: 'app', status: 'published', excerpt: 'Full invoice view with line items, totals, payment details, and actions.' } },
    { type: 'text', text: "Check the preview — the status badge updates based on payment state. Want to add anything else?" },
  ], timestamp: '2026-02-10T09:32:00Z' },

  // Fuego Collective — assistant
  { id: 'fc1-1', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Welcome to Fuego Collective! Let's get your hot sauce empire online. I'll set up WooCommerce and get your shop ready to take orders." }], timestamp: '2026-02-14T12:30:00Z' },
  { id: 'fc1-2', conversationId: 'fuego-assistant-1', role: 'user', content: [{ type: 'text', text: 'Hell yeah. I need product pages for each sauce, a shop page, and checkout. We have 8 sauces ranging from mild to "sign a waiver" hot.' }], timestamp: '2026-02-14T12:31:00Z', messageContext: { source: 'typed' } },
  { id: 'fc1-3', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'assistant', content: [
    { type: 'card', card: 'progress', data: { label: 'Setting up WooCommerce', steps: [
      { name: 'Installed WooCommerce plugin', status: 'done' },
      { name: 'Created Shop, Cart, and Checkout pages', status: 'done' },
      { name: 'Configured shipping for glass bottles (fragile handling)', status: 'done' },
      { name: 'Set up Stripe payments', status: 'done' },
    ] } },
    { type: 'text', text: "WooCommerce is live. I've configured shipping with fragile handling rules for glass bottles and set up weight-based rates. Want me to start adding your sauces?" },
  ], timestamp: '2026-02-14T12:32:00Z' },
  { id: 'fc1-4', conversationId: 'fuego-assistant-1', role: 'user', content: [{ type: 'text', text: "Start with Smoky Habanero — it's our flagship. $14, 5oz bottle. Then add the rest. Oh, and I want a heat level rating on each product page." }], timestamp: '2026-02-14T12:33:00Z', messageContext: { source: 'typed' } },
  { id: 'fc1-5', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Smoky Habanero is up — $14, 5oz, with Scoville rating, ingredient list, and suggested pairings. I've added a custom 'Heat Level' field using ACF that shows a 🌶️ scale from 1-5 on every product page. Adding the rest of the lineup now." }], timestamp: '2026-02-14T12:34:00Z' },
  { id: 'fc1-6', conversationId: 'fuego-assistant-1', role: 'user', content: [{ type: 'text', text: "Nice. Can we also set up a subscription box? Monthly hot sauce club — 3 bottles for $36." }], timestamp: '2026-02-14T12:35:00Z', messageContext: { source: 'typed' } },
  { id: 'fc1-7', conversationId: 'fuego-assistant-1', role: 'agent', agentId: 'assistant', content: [
    { type: 'text', text: "Done! All 8 sauces are live with heat ratings, and I've set up WooCommerce Subscriptions for the monthly club. The 'Fuego Club' product is a $36/month subscription that ships 3 rotating bottles. Subscribers get free shipping too. Check out the shop page!" },
    { type: 'card', card: 'page', data: { title: 'Shop', slug: '/shop', template: 'page', status: 'published', excerpt: '8 small-batch hot sauces plus a monthly subscription club.' } },
  ], timestamp: '2026-02-14T12:36:00Z' },

  // Ledger — code
  { id: 'lc1-1', conversationId: 'ledger-code-1', role: 'agent', agentId: 'code', content: [{ type: 'text', text: "I'm the code agent for Ledger. I can wire up APIs, handle data models, or build custom components. What do you need?" }], timestamp: '2026-02-11T10:00:00Z' },
  { id: 'lc1-2', conversationId: 'ledger-code-1', role: 'user', content: [{ type: 'text', text: 'I need a REST endpoint that returns invoice status — whether it\'s paid, pending, or overdue based on the due date.' }], timestamp: '2026-02-11T10:01:00Z', messageContext: { source: 'typed' } },
  { id: 'lc1-3', conversationId: 'ledger-code-1', role: 'agent', agentId: 'code', content: [
    { type: 'card', card: 'progress', data: { label: 'Building payment status endpoint', steps: [
      { name: 'Created invoice status model', status: 'done' },
      { name: 'Added GET /api/invoices/:id/status route', status: 'done' },
      { name: 'Implemented overdue detection logic', status: 'done' },
      { name: 'Added response schema validation', status: 'done' },
    ] } },
    { type: 'text', text: "The endpoint is live at `GET /api/invoices/:id/status`. It returns `{ status: 'paid' | 'pending' | 'overdue', daysUntilDue: number, amountDue: number }`. Overdue is calculated automatically from the due date. Want me to add webhook notifications for status changes?" },
  ], timestamp: '2026-02-11T10:02:00Z' },

  // All Sites — WordPress updates
  { id: 'as1-1', conversationId: 'all-sites-updates', role: 'user', content: [{ type: 'text', text: 'Can you check which sites need WordPress updates?' }], timestamp: '2026-02-28T10:00:00Z', messageContext: { source: 'typed' } },
  { id: 'as1-2', conversationId: 'all-sites-updates', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "I've checked all your sites. Here's the status:\n\n**Downstreet Café** — WordPress 7.0-beta2 (latest beta)\n**Studio Meridian** — WordPress 6.7.1 (update available: 7.0-beta2)\n\nWould you like me to update Studio Meridian to the latest version?" }], timestamp: '2026-02-28T10:00:30Z' },
  { id: 'as1-3', conversationId: 'all-sites-updates', role: 'user', content: [{ type: 'text', text: 'Yes, update it.' }], timestamp: '2026-02-28T10:01:00Z', messageContext: { source: 'typed' } },
  { id: 'as1-4', conversationId: 'all-sites-updates', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "Done! Studio Meridian is now running WordPress 7.0-beta2. Both sites are on the same version now." }], timestamp: '2026-02-28T10:01:30Z' },

  // All Sites — Plugin check
  { id: 'as2-1', conversationId: 'all-sites-plugins', role: 'user', content: [{ type: 'text', text: 'Are any of my plugins outdated across my sites?' }], timestamp: '2026-03-01T14:00:00Z', messageContext: { source: 'typed' } },
  { id: 'as2-2', conversationId: 'all-sites-plugins', role: 'agent', agentId: 'assistant', content: [{ type: 'text', text: "I've scanned all plugins across your sites:\n\n**Downstreet Café** (4 plugins)\n- Jetpack 14.2 → 14.3 available\n- WooCommerce 9.5.1 (up to date)\n- Akismet 5.3.4 (up to date)\n- Reservations Plugin 1.0.0 (custom, no updates)\n\n**Studio Meridian** (2 plugins)\n- Jetpack 14.1 → 14.3 available\n- Yoast SEO 24.1 (up to date)\n\nJetpack needs updating on both sites. Want me to update them?" }], timestamp: '2026-03-01T14:00:30Z' },
]
