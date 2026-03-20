import type { SiteFiles } from '@/data/useSiteTemplates'
import cafe from './cafe/index'
import gallery from './gallery/index'

export const sites: Record<string, SiteFiles> = {
  cafe,
  gallery,
}
