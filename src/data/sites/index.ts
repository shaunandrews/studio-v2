import type { SiteFiles } from '@/data/useSiteTemplates'
import cafe from './cafe/index'
import portfolio from './portfolio/index'

export const sites: Record<string, SiteFiles> = {
  cafe,
  portfolio,
}
