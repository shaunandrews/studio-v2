import { computed, type Ref } from 'vue'
import { dashboard, post, page, desktop, styles, symbolFilled, navigation, layout, color, widget, menu, brush, cart, store, shipping, cog } from '@wordpress/icons'
import type { ThemeType } from './types'

export interface WPAdminLink {
  icon: any
  label: string
}

export function useWPAdmin(themeType: Ref<ThemeType>, features: Ref<string[]>) {
  const hasWoo = computed(() => features.value.includes('woocommerce'))

  const adminLinks = computed<WPAdminLink[]>(() => {
    const links: WPAdminLink[] = [
      { icon: dashboard, label: 'WP Admin' },
      { icon: post, label: 'Posts' },
      { icon: page, label: 'Pages' },
    ]

    if (themeType.value === 'block') {
      links.push(
        { icon: desktop, label: 'Site Editor' },
        { icon: styles, label: 'Styles' },
        { icon: symbolFilled, label: 'Patterns' },
        { icon: navigation, label: 'Navigation' },
        { icon: layout, label: 'Templates' },
      )
    } else {
      links.push(
        { icon: color, label: 'Customizer' },
        { icon: widget, label: 'Widgets' },
        { icon: menu, label: 'Menus' },
        { icon: brush, label: 'Theme' },
      )
    }

    if (hasWoo.value) {
      links.push(
        { icon: store, label: 'Products' },
        { icon: cart, label: 'Orders' },
        { icon: shipping, label: 'Shipping' },
        { icon: cog, label: 'WooCommerce' },
      )
    }

    return links
  })

  return { adminLinks }
}
