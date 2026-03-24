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
  slug: string
  template: string
  isCollection?: boolean
  collectionCount?: number
  children?: SiteMapNode[]
}

export function deriveSiteMapTree(config: SiteConfig): SiteMapNode {
  const homePage = config.pages.find(p => p.slug === '/')
  const root: SiteMapNode = {
    label: homePage?.title ?? 'Home',
    slug: '/',
    template: homePage?.template ?? 'home',
  }

  const children: SiteMapNode[] = []
  for (const page of config.pages) {
    if (page.slug === '/') continue
    const node: SiteMapNode = {
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
