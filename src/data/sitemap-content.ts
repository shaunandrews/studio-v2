/**
 * Site map content definitions for each site layout.
 * Each node carries real, site-specific content for its page mock.
 */

export type PageType =
  | 'home' | 'content' | 'listing' | 'single' | 'form'
  | 'product-grid' | 'product-single' | 'gallery' | 'docs'
  | 'cart' | 'menu' | 'pricing' | 'services'
  | 'cafe-menu' | 'cafe-about' | 'cafe-blog' | 'cafe-post'
  | 'cafe-reservations' | 'cafe-contact'

export interface ListItem {
  title: string
  desc?: string
  meta?: string
  price?: string
  img?: string
}

export interface SidebarItem {
  label: string
  active?: boolean
}

export interface PricingTier {
  name: string
  price: string
  period?: string
  cta: string
  featured?: boolean
}

export interface PageContent {
  heading?: string
  subheading?: string
  heroImage?: string
  heroText?: string
  body?: string[]
  items?: ListItem[]
  fields?: string[]
  submitLabel?: string
  sidebarSections?: { title: string; items: SidebarItem[] }[]
  code?: string
  tiers?: PricingTier[]
  categories?: { name: string; items: ListItem[] }[]
  serviceCards?: { icon: string; title: string; desc: string }[]
  productName?: string
  productPrice?: string
  productDesc?: string
  cartItems?: { name: string; price: string; qty?: number }[]
  cartTotal?: string
}

export interface SiteMapNode {
  label: string
  pageType: PageType
  isCollection?: boolean
  collectionCount?: number
  children?: SiteMapNode[]
  content: PageContent
}

/* ── Downstreet Café ── */

const cafe: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    { label: 'Menu', pageType: 'cafe-menu', content: {} },
    { label: 'About', pageType: 'cafe-about', content: {} },
    {
      label: 'Blog', pageType: 'cafe-blog', content: {},
      children: [
        { label: 'Post', pageType: 'cafe-post', isCollection: true, collectionCount: 12, content: {} },
      ],
    },
    { label: 'Reservations', pageType: 'cafe-reservations', content: {} },
    { label: 'Contact', pageType: 'cafe-contact', content: {} },
  ],
}

/* ── Studio Meridian ── */

const portfolio: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    {
      label: 'Work', pageType: 'listing',
      content: {
        heading: 'Selected Work',
        items: [
          { title: 'Finova Banking', desc: 'Brand identity and digital platform', meta: 'Branding · Web' },
          { title: 'Relay Health', desc: 'Product design system and mobile app', meta: 'Product · Design System' },
          { title: 'Onda Surf Co.', desc: 'E-commerce experience and visual identity', meta: 'E-commerce · Branding' },
        ],
      },
      children: [
        {
          label: 'Project', pageType: 'single', isCollection: true, collectionCount: 8,
          content: {
            heading: 'Finova Banking',
            subheading: 'Branding · Web · 2026',
            body: [
              'We partnered with Finova to reimagine their digital banking experience from the ground up — new brand identity, design system, and responsive web platform.',
              'The result: a 40% increase in digital account openings and an NPS score jump from 32 to 61.',
            ],
          },
        },
      ],
    },
    {
      label: 'About', pageType: 'content',
      content: {
        heading: 'About the Studio',
        body: [
          'Studio Meridian is a small design studio specializing in brand identity, digital products, and design systems. We\'ve been crafting thoughtful work since 2018.',
          'Our team of six works with startups and established brands alike, bringing clarity and craft to every project.',
        ],
      },
    },
    {
      label: 'Services', pageType: 'services',
      content: {
        heading: 'What We Do',
        serviceCards: [
          { icon: '◆', title: 'Strategy', desc: 'Brand positioning, user research, and product strategy' },
          { icon: '◉', title: 'Design', desc: 'Visual identity, UI/UX, and design systems' },
          { icon: '⚙', title: 'Engineering', desc: 'Frontend development and design-to-code' },
        ],
      },
    },
    {
      label: 'Contact', pageType: 'form',
      content: {
        heading: 'Get in Touch',
        subheading: 'Tell us about your project.',
        fields: ['Name', 'Email', 'Company', 'Budget range', 'Project details'],
        submitLabel: 'Send inquiry',
      },
    },
  ],
}

/* ── Thread & Co. ── */

const store: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    {
      label: 'Shop', pageType: 'product-grid',
      content: {
        heading: 'All Products',
        items: [
          { title: 'Classic Watch', price: '$89' },
          { title: 'Wireless Headphones', price: '$129' },
          { title: 'Polaroid Camera', price: '$64' },
          { title: 'Aviator Sunglasses', price: '$45' },
          { title: 'Leather Backpack', price: '$156' },
          { title: 'Canvas Tote', price: '$38' },
        ],
      },
      children: [
        {
          label: 'Product', pageType: 'product-single', isCollection: true, collectionCount: 24,
          content: {
            productName: 'Classic Watch',
            productPrice: '$89',
            productDesc: 'Minimal analog watch with a 38mm brushed steel case, Japanese quartz movement, and interchangeable leather strap.',
          },
        },
      ],
    },
    {
      label: 'Cart', pageType: 'cart',
      content: {
        heading: 'Your Cart',
        cartItems: [
          { name: 'Classic Watch', price: '$89', qty: 1 },
          { name: 'Canvas Tote', price: '$38', qty: 2 },
        ],
        cartTotal: '$165',
        submitLabel: 'Checkout',
      },
    },
    {
      label: 'About', pageType: 'content',
      content: {
        heading: 'Our Story',
        body: [
          'Thread & Co. started in a garage in Portland with a belief that everyday essentials should be well-designed and honestly priced.',
          'We work directly with makers to cut out middlemen and pass the savings on. Every product is guaranteed for life.',
        ],
      },
    },
    {
      label: 'Contact', pageType: 'form',
      content: {
        heading: 'Customer Support',
        subheading: 'We typically respond within 24 hours.',
        fields: ['Name', 'Email', 'Order number', 'How can we help?'],
        submitLabel: 'Send message',
      },
    },
  ],
}

/* ── Arlo Writes ── */

const blog: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    {
      label: 'Blog', pageType: 'listing',
      content: {
        heading: 'All Articles',
        items: [
          { title: 'Design Systems Don\'t Kill Creativity', desc: 'Why constraints are the best thing for your design process.', meta: '8 min · Mar 2' },
          { title: 'The Quiet Power of Boring Technology', desc: 'The best engineering decisions are the ones nobody talks about.', meta: '5 min · Feb 24' },
          { title: 'Shipping Weekly Changed Everything', desc: 'How a cadence of small releases transformed our team.', meta: '6 min · Feb 18' },
          { title: 'Why I Stopped Using Figma', desc: 'And what I use instead for rapid prototyping.', meta: '4 min · Feb 10' },
        ],
      },
      children: [
        {
          label: 'Post', pageType: 'single', isCollection: true, collectionCount: 36,
          content: {
            heading: 'Design Systems Don\'t Kill Creativity',
            subheading: 'March 2, 2026 · 8 min read',
            body: [
              'There\'s a persistent myth that design systems stifle creativity. That once you codify your patterns, you\'ve locked yourself into a cage.',
              'The opposite is true. Systems free you from reinventing the wheel so you can focus on the problems that actually matter.',
            ],
          },
        },
      ],
    },
    {
      label: 'About', pageType: 'content',
      content: {
        heading: 'About Arlo',
        body: [
          'I\'m a designer and engineer writing about the craft of building digital products. I\'ve spent the last decade at startups and agencies.',
          'This blog is where I think out loud — about design, code, process, and the small decisions that compound into great work.',
        ],
      },
    },
    {
      label: 'Contact', pageType: 'form',
      content: {
        heading: 'Say Hello',
        subheading: 'Got a question, idea, or just want to chat?',
        fields: ['Name', 'Email', 'Message'],
        submitLabel: 'Send',
      },
    },
  ],
}

/* ── Launchpad ── */

const landing: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    {
      label: 'Features', pageType: 'services',
      content: {
        heading: 'Everything You Need',
        subheading: 'A complete platform for modern development teams.',
        serviceCards: [
          { icon: '⚡', title: 'Instant Deploys', desc: 'Push to deploy in under 10 seconds. Zero config, zero downtime.' },
          { icon: '🔒', title: 'Secure by Default', desc: 'SSL, DDoS protection, and automated backups on every plan.' },
          { icon: '📊', title: 'Built-in Analytics', desc: 'Real-time metrics without third-party scripts.' },
          { icon: '🔄', title: 'Auto Scaling', desc: 'From zero to millions of requests. We handle the infrastructure.' },
          { icon: '🧩', title: '50+ Integrations', desc: 'Connect with the tools your team already uses.' },
          { icon: '💬', title: '24/7 Support', desc: 'Real humans, not bots. Average response time under 5 minutes.' },
        ],
      },
    },
    {
      label: 'Pricing', pageType: 'pricing',
      content: {
        heading: 'Simple, Transparent Pricing',
        subheading: 'No surprises. Cancel anytime.',
        tiers: [
          { name: 'Starter', price: '$0', period: '/mo', cta: 'Get started' },
          { name: 'Pro', price: '$29', period: '/mo', cta: 'Start free trial', featured: true },
          { name: 'Enterprise', price: 'Custom', cta: 'Contact sales' },
        ],
      },
    },
    {
      label: 'About', pageType: 'content',
      content: {
        heading: 'Our Mission',
        body: [
          'Launchpad was founded in 2024 by a team of engineers tired of fighting infrastructure instead of building products.',
          'We believe deployment should be invisible. Our platform handles the hard parts so your team can focus on what matters: shipping great software.',
        ],
      },
    },
    {
      label: 'Contact', pageType: 'form',
      content: {
        heading: 'Talk to Us',
        subheading: 'Questions about pricing, features, or enterprise plans?',
        fields: ['Name', 'Work email', 'Company', 'Team size', 'Message'],
        submitLabel: 'Send message',
      },
    },
  ],
}

/* ── DevRef Docs ── */

const docs: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    {
      label: 'Docs', pageType: 'docs',
      content: {
        heading: 'Quick Start',
        sidebarSections: [
          {
            title: 'Getting Started',
            items: [
              { label: 'Installation' },
              { label: 'Quick Start', active: true },
              { label: 'Configuration' },
              { label: 'Deployment' },
            ],
          },
          {
            title: 'Core Concepts',
            items: [
              { label: 'Routing' },
              { label: 'Data Fetching' },
              { label: 'Authentication' },
            ],
          },
        ],
        body: [
          'Get up and running in under five minutes. This guide walks you through creating your first project.',
        ],
        code: 'npx create-app@latest my-project\ncd my-project\nnpm run dev',
      },
      children: [
        {
          label: 'Article', pageType: 'docs', isCollection: true, collectionCount: 42,
          content: {
            heading: 'Authentication',
            sidebarSections: [
              {
                title: 'Core Concepts',
                items: [
                  { label: 'Routing' },
                  { label: 'Data Fetching' },
                  { label: 'Authentication', active: true },
                  { label: 'Middleware' },
                ],
              },
              {
                title: 'API Reference',
                items: [
                  { label: 'CLI Commands' },
                  { label: 'Config Options' },
                ],
              },
            ],
            body: [
              'DevRef provides built-in authentication with support for OAuth, API keys, and session tokens.',
            ],
            code: 'import { auth } from \'devref\'\n\nconst user = await auth.verify(token)',
          },
        },
      ],
    },
    {
      label: 'Blog', pageType: 'listing',
      content: {
        heading: 'Engineering Blog',
        items: [
          { title: 'Migrating to v3: What Changed', desc: 'A guide to the breaking changes and how to upgrade.', meta: 'Mar 8' },
          { title: 'How We Cut Build Times by 60%', desc: 'The caching strategy behind our latest performance win.', meta: 'Feb 20' },
          { title: 'Introducing Plugin API 2.0', desc: 'A more powerful, type-safe way to extend DevRef.', meta: 'Feb 5' },
        ],
      },
      children: [
        {
          label: 'Post', pageType: 'single', isCollection: true, collectionCount: 10,
          content: {
            heading: 'Migrating to v3: What Changed',
            subheading: 'March 8, 2026 · DevRef Team',
            body: [
              'Version 3 brings a new module system, improved tree-shaking, and first-class TypeScript support.',
              'This guide covers the breaking changes and gives you a step-by-step migration path.',
            ],
          },
        },
      ],
    },
    {
      label: 'About', pageType: 'content',
      content: {
        heading: 'About DevRef',
        body: [
          'DevRef is an open-source documentation platform built for developer teams. Fast, searchable, and version-aware.',
          'Used by over 2,000 teams to power their API references, guides, and internal knowledge bases.',
        ],
      },
    },
  ],
}

/* ── Wild Lens ── */

const gallery: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    {
      label: 'Gallery', pageType: 'gallery',
      content: {
        heading: 'Portfolio',
      },
      children: [
        {
          label: 'Album', pageType: 'gallery', isCollection: true, collectionCount: 15,
          content: {
            heading: 'Mountain Light',
          },
        },
      ],
    },
    {
      label: 'About', pageType: 'content',
      content: {
        heading: 'About',
        body: [
          'I\'m a landscape and wildlife photographer based in the Pacific Northwest. My work explores the quiet drama of wild places.',
          'Available for editorial, commercial, and fine art print commissions.',
        ],
      },
    },
    {
      label: 'Contact', pageType: 'form',
      content: {
        heading: 'Inquiries',
        subheading: 'For prints, licensing, or commissions.',
        fields: ['Name', 'Email', 'Project type', 'Details'],
        submitLabel: 'Send',
      },
    },
  ],
}

/* ── Default ── */

const defaultSite: SiteMapNode = {
  label: 'Home', pageType: 'home', content: {},
  children: [
    {
      label: 'About', pageType: 'content',
      content: {
        heading: 'About',
        body: [
          'Welcome to our site. We\'re glad you\'re here.',
        ],
      },
    },
    {
      label: 'Blog', pageType: 'listing',
      content: {
        heading: 'Blog',
        items: [
          { title: 'Hello World', desc: 'Welcome to WordPress. This is your first post.', meta: 'Mar 17' },
        ],
      },
      children: [
        {
          label: 'Post', pageType: 'single', isCollection: true, collectionCount: 5,
          content: {
            heading: 'Hello World',
            subheading: 'March 17, 2026',
            body: [
              'Welcome to WordPress. This is your first post. Edit or delete it, then start writing!',
            ],
          },
        },
      ],
    },
    {
      label: 'Contact', pageType: 'form',
      content: {
        heading: 'Contact',
        fields: ['Name', 'Email', 'Message'],
        submitLabel: 'Submit',
      },
    },
  ],
}

export const siteMapTrees: Record<string, SiteMapNode> = {
  cafe,
  portfolio,
  store,
  blog,
  landing,
  docs,
  gallery,
  default: defaultSite,
}
