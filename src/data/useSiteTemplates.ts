export interface SiteTheme {
  colors: Record<string, string>
  fonts: Record<string, string>
  fontSizes: Record<string, string>
  fontWeights: Record<string, number>
  lineHeights: Record<string, number>
  spacing: Record<string, string>
  radii: Record<string, string>
  layout: Record<string, string>
}

export interface SitePageDef {
  slug: string
  title: string
  template: string
  wpTemplate?: string
  collection?: {
    slug: string
    title: string
    template: string
    wpTemplate?: string
    count: number
  }
}

export interface WPTemplateDef {
  slug: string
  label: string
  renders?: string[]
}

export interface SiteConfig {
  name: string
  description: string
  favicon?: string
  theme: SiteTheme
  parts: string[]
  pages: SitePageDef[]
  wpTemplates?: WPTemplateDef[]
}

export interface SiteFiles {
  config: SiteConfig
  parts: Record<string, string>
  templates: Record<string, string>
}

export interface CanvasNode {
  label: string
  slug: string
  template: string
  isCollection?: boolean
  collectionCount?: number
  children?: CanvasNode[]
}

export interface CanvasPart {
  id: string
  label: string
}

export function deriveCanvasParts(config: SiteConfig): CanvasPart[] {
  return config.parts.map(part => ({
    id: `shared-${part}`,
    label: part.charAt(0).toUpperCase() + part.slice(1),
  }))
}

export function deriveCanvasTree(config: SiteConfig): CanvasNode {
  const homePage = config.pages.find(p => p.slug === '/')
  const root: CanvasNode = {
    label: homePage?.title ?? 'Home',
    slug: '/',
    template: homePage?.template ?? 'home',
  }

  const children: CanvasNode[] = []
  for (const page of config.pages) {
    if (page.slug === '/') continue
    const node: CanvasNode = {
      label: page.title,
      slug: page.slug,
      template: page.template,
    }
    if (page.collection) {
      node.children = [{
        label: page.collection.title,
        slug: page.collection.slug,
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
