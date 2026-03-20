import type { SiteFiles } from '@/data/useSiteTemplates'
import cafe from './cafe/index'
import defaultSite from './default/index'

export const sites: Record<string, SiteFiles> = {
  cafe,
  default: defaultSite,
}
