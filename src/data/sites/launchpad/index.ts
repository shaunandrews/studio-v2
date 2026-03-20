import config from './site.json'
import header from './parts/header.html?raw'
import footer from './parts/footer.html?raw'
import home from './templates/home.html?raw'
import features from './templates/features.html?raw'
import pricing from './templates/pricing.html?raw'
import about from './templates/about.html?raw'
import contact from './templates/contact.html?raw'

import type { SiteFiles } from '@/data/useSiteTemplates'

export default {
  config,
  parts: { header, footer },
  templates: { home, features, pricing, about, contact },
} satisfies SiteFiles
