import config from './site.json'
import header from './parts/header.html?raw'
import footer from './parts/footer.html?raw'
import home from './templates/home.html?raw'
import menu from './templates/menu.html?raw'
import about from './templates/about.html?raw'
import blog from './templates/blog.html?raw'
import post from './templates/post.html?raw'
import reservations from './templates/reservations.html?raw'
import contact from './templates/contact.html?raw'

import type { SiteFiles } from '@/data/useSiteTemplates'

export default {
  config,
  parts: { header, footer },
  templates: { home, menu, about, blog, post, reservations, contact },
} satisfies SiteFiles
