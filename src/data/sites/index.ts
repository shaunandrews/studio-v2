import type { SiteFiles } from '@/data/useSiteTemplates'
import cafe from './cafe/index'
import blog from './blog/index'

export const sites: Record<string, SiteFiles> = {
  cafe,
  blog,
}
