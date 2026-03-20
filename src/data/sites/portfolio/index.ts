import config from './site.json'
import header from './parts/header.html?raw'
import footer from './parts/footer.html?raw'
import home from './templates/home.html?raw'
import work from './templates/work.html?raw'
import project from './templates/project.html?raw'
import about from './templates/about.html?raw'
import services from './templates/services.html?raw'
import contact from './templates/contact.html?raw'

import type { SiteFiles } from '@/data/useSiteTemplates'

export default {
  config,
  parts: { header, footer },
  templates: { home, work, project, about, services, contact },
} satisfies SiteFiles
