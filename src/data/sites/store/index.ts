import config from './site.json'
import header from './parts/header.html?raw'
import footer from './parts/footer.html?raw'
import home from './templates/home.html?raw'
import shop from './templates/shop.html?raw'
import product from './templates/product.html?raw'
import cart from './templates/cart.html?raw'
import about from './templates/about.html?raw'
import contact from './templates/contact.html?raw'

import type { SiteFiles } from '@/data/useSiteTemplates'

export default {
  config,
  parts: { header, footer },
  templates: { home, shop, product, cart, about, contact },
} satisfies SiteFiles
