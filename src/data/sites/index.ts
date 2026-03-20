import type { SiteFiles } from '@/data/useSiteTemplates'
import cafe from './cafe/index'
import store from './store/index'

export const sites: Record<string, SiteFiles> = {
  cafe,
  store,
}
