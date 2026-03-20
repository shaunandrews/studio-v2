import { ref } from 'vue'
import { sendSectionUpdate, sendThemeUpdate, sendPageUpdate } from './site-renderer'
import type { SiteContent } from './site-types'

const iframeRef = ref<HTMLIFrameElement | null>(null)

export function usePreviewSync() {
  function registerIframe(el: HTMLIFrameElement | null) {
    iframeRef.value = el
  }

  function unregisterIframe() {
    iframeRef.value = null
  }

  function pushSectionUpdate(sectionId: string, html: string, css: string, order?: number) {
    if (!iframeRef.value) return
    sendSectionUpdate(iframeRef.value, sectionId, html, css, order)
  }

  function pushThemeUpdate(variables: Record<string, string>) {
    if (!iframeRef.value) return
    sendThemeUpdate(iframeRef.value, variables)
  }

  function pushPageUpdate(content: SiteContent, pageSlug: string) {
    if (!iframeRef.value) return
    sendPageUpdate(iframeRef.value, content, pageSlug, { preserveScroll: true })
  }

  return {
    iframeRef,
    registerIframe,
    unregisterIframe,
    pushSectionUpdate,
    pushThemeUpdate,
    pushPageUpdate,
  }
}
