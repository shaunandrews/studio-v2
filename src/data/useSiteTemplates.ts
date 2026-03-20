export interface SiteTheme {
  colors: Record<string, string>
  fonts: Record<string, string>
  spacing: Record<string, string>
}

export interface SitePageDef {
  slug: string
  title: string
  template: string
  collection?: {
    slug: string
    title: string
    template: string
    count: number
  }
}

export interface SiteConfig {
  name: string
  description: string
  favicon?: string
  theme: SiteTheme
  parts: string[]
  pages: SitePageDef[]
}

export interface SiteFiles {
  config: SiteConfig
  parts: Record<string, string>
  templates: Record<string, string>
}

export interface SiteMapNode {
  label: string
  template: string
  isCollection?: boolean
  collectionCount?: number
  children?: SiteMapNode[]
}

function buildThemeCSS(theme: SiteTheme): string {
  const vars: string[] = []
  for (const [key, value] of Object.entries(theme.colors)) {
    vars.push(`  --${key}: ${value};`)
  }
  for (const [key, value] of Object.entries(theme.fonts)) {
    vars.push(`  --font-${key}: ${value};`)
  }
  for (const [key, value] of Object.entries(theme.spacing)) {
    vars.push(`  --${key}: ${value};`)
  }
  return `:root {\n${vars.join('\n')}\n}`
}

function buildFontLinks(fonts: Record<string, string>): string {
  const families = [...new Set(Object.values(fonts))]
    .filter(f => !f.includes('-apple-system') && !f.includes('sans-serif'))
    .map(f => {
      const name = f.replace(/'.+?'/, m => m.slice(1, -1)).split(',')[0].trim()
      return `family=${name.replace(/ /g, '+')}:wght@400;500;600;700`
    })
  if (families.length === 0) return ''
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.join('&')}&display=swap">`
}

function resolveParts(html: string, parts: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, name) => parts[name] ?? '')
}

export function assemblePage(site: SiteFiles, templateName: string): string {
  const template = site.templates[templateName]
  if (!template) return ''

  const body = resolveParts(template, site.parts)
  const themeCSS = buildThemeCSS(site.config.theme)
  const fontLinks = buildFontLinks(site.config.theme.fonts)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${fontLinks}
<style>
${themeCSS}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: var(--font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif); color: var(--text, #1a1a1a); background: var(--bg, #fff); -webkit-font-smoothing: antialiased; }
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }
</style>
</head>
<body>
${body}
</body>
</html>`
}

export function deriveSiteMapTree(config: SiteConfig): SiteMapNode {
  const root: SiteMapNode = {
    label: config.pages.find(p => p.slug === '/')?.title ?? 'Home',
    template: config.pages.find(p => p.slug === '/')?.template ?? 'home',
  }

  const children: SiteMapNode[] = []
  for (const page of config.pages) {
    if (page.slug === '/') continue
    const node: SiteMapNode = {
      label: page.title,
      template: page.template,
    }
    if (page.collection) {
      node.children = [{
        label: page.collection.title,
        template: page.collection.template,
        isCollection: true,
        collectionCount: page.collection.count,
      }]
    }
    children.push(node)
  }

  root.children = children
  return root
}
