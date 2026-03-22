import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Modal from '../components/primitives/Modal.vue'

const stubs = {
  WPIcon: { template: '<span class="wp-icon-stub" />' },
  Text: { template: '<span class="text-stub"><slot /></span>' },
}

function createWrapper(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(Modal, {
    props: {
      open: true,
      ...props,
    },
    slots: {
      default: '<p>Modal content</p>',
      ...slots,
    },
    global: { stubs },
    attachTo: document.body,
  })
}

describe('Modal', () => {
  describe('visibility', () => {
    it('renders content when open', () => {
      const w = createWrapper({ open: true, embedded: true })
      expect(w.text()).toContain('Modal content')
    })

    it('does not render teleported content when closed', () => {
      const w = createWrapper({ open: false })
      // Teleported modal should not be in the DOM
      expect(document.querySelector('.modal-scrim')).toBeNull()
      w.unmount()
    })

    it('renders teleported content when open', () => {
      const w = createWrapper({ open: true })
      // Teleported to body
      expect(document.querySelector('.modal-scrim')).toBeTruthy()
      w.unmount()
    })
  })

  describe('embedded mode', () => {
    it('renders inline without scrim', () => {
      const w = createWrapper({ open: true, embedded: true })
      expect(w.find('.modal-panel--embedded').exists()).toBe(true)
      expect(document.querySelector('.modal-scrim')).toBeNull()
      w.unmount()
    })

    it('does not have close button enabled in embedded mode', () => {
      const w = createWrapper({ open: true, embedded: true })
      const closeBtn = w.find('.modal-close')
      expect(closeBtn.exists()).toBe(true)
      expect(closeBtn.attributes('disabled')).toBeDefined()
      w.unmount()
    })
  })

  describe('header and footer', () => {
    it('shows title in header', () => {
      const w = createWrapper({ open: true, embedded: true, title: 'Test Title' })
      expect(w.find('.modal-header').exists()).toBe(true)
      w.unmount()
    })

    it('hides header when no title or header slot', () => {
      const w = createWrapper({ open: true, embedded: true })
      expect(w.find('.modal-header').exists()).toBe(false)
      w.unmount()
    })

    it('shows footer when slot provided', () => {
      const w = createWrapper(
        { open: true, embedded: true },
        { footer: '<button>OK</button>' },
      )
      expect(w.find('.modal-footer').exists()).toBe(true)
      w.unmount()
    })

    it('hides footer when no slot', () => {
      const w = createWrapper({ open: true, embedded: true })
      expect(w.find('.modal-footer').exists()).toBe(false)
      w.unmount()
    })
  })

  describe('close behavior', () => {
    it('emits close on Escape key', async () => {
      const w = createWrapper({ open: true, embedded: true })
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await w.vm.$nextTick()
      expect(w.emitted('close')).toBeTruthy()
      w.unmount()
    })

    it('teleported modal renders close button and scrim', async () => {
      const w = createWrapper({ open: true })
      expect(document.querySelector('.modal-scrim')).toBeTruthy()
      expect(document.querySelector('.modal-close')).toBeTruthy()
      expect(document.querySelector('.modal-panel')).toBeTruthy()
      w.unmount()
    })
  })

  describe('closable prop', () => {
    it('hides close button when closable is false', () => {
      const w = createWrapper({ open: true, embedded: true, closable: false })
      expect(w.find('.modal-close').exists()).toBe(false)
      w.unmount()
    })
  })

  describe('width prop', () => {
    it('applies custom width', () => {
      const w = createWrapper({ open: true, embedded: true, width: '600px' })
      expect(w.find('.modal-panel').attributes('style')).toContain('width: 600px')
      w.unmount()
    })

    it('uses default width of 480px', () => {
      const w = createWrapper({ open: true, embedded: true })
      expect(w.find('.modal-panel').attributes('style')).toContain('width: 480px')
      w.unmount()
    })
  })

  describe('cleanup', () => {
    it('removes keydown listener on unmount', () => {
      const spy = vi.spyOn(document, 'removeEventListener')
      const w = createWrapper({ open: true, embedded: true })
      w.unmount()
      expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
      spy.mockRestore()
    })
  })
})
