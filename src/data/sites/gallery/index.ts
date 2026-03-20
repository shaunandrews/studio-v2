import config from './site.json'
import header from './parts/header.html?raw'
import footer from './parts/footer.html?raw'
import home from './templates/home.html?raw'
import gallery from './templates/gallery.html?raw'
import album from './templates/album.html?raw'
import about from './templates/about.html?raw'
import contact from './templates/contact.html?raw'

import type { SiteFiles } from '@/data/useSiteTemplates'

export default {
  config,
  parts: { header, footer },
  templates: { home, gallery, album, about, contact },
} satisfies SiteFiles
