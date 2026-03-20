import type { SiteFiles } from '@/data/useSiteTemplates'
import cafe from './cafe/index'
import portfolio from './portfolio/index'
import store from './store/index'
import gallery from './gallery/index'
import landing from './launchpad/index'
import defaultSite from './default/index'

export const sites: Record<string, SiteFiles> = {
  cafe,
  portfolio,
  store,
  gallery,
  landing,
  default: defaultSite,
}
