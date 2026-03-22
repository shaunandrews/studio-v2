import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import InputChat from '../components/composites/InputChat.vue'

// Stub child components that are hard to render in test env
const stubs = {
  WPIcon: { template: '<span class="wp-icon-stub" />' },
  FlyoutMenu: { template: '<div class="flyout-stub"><slot name="trigger" :toggle="() => {}" :open="false" /></div>' },
  Tooltip: { template: '<div class="tooltip-stub"><slot /></div>' },
  ContextRing: { template: '<div class="ring-stub" />' },
}

function createWrapper(props: Record<string, unknown> = {}) {
  return mount(InputChat, {
    props: {
      modelValue: '',
      ...props,
    },
    global: { stubs },
  })
}

describe('InputChat', () => {
  describe('rendering', () => {
    it('renders a textarea with placeholder', () => {
      const w = createWrapper({ placeholder: 'Type here...' })
      const textarea = w.find('textarea')
      expect(textarea.exists()).toBe(true)
      expect(textarea.attributes('placeholder')).toBe('Type here...')
    })

    it('uses default placeholder', () => {
      const w = createWrapper()
      expect(w.find('textarea').attributes('placeholder')).toBe('Ask anything...')
    })

    it('renders send button', () => {
      const w = createWrapper()
      const btn = w.find('.input-submit')
      expect(btn.exists()).toBe(true)
    })
  })

  describe('send behavior', () => {
    it('disables send button when empty', () => {
      const w = createWrapper({ modelValue: '' })
      const btn = w.find('.input-submit')
      expect(btn.attributes('disabled')).toBeDefined()
      expect(btn.classes()).not.toContain('is-active')
    })

    it('enables send button when text is present', () => {
      const w = createWrapper({ modelValue: 'hello' })
      const btn = w.find('.input-submit')
      expect(btn.attributes('disabled')).toBeUndefined()
      expect(btn.classes()).toContain('is-active')
    })

    it('emits send on button click', async () => {
      const w = createWrapper({ modelValue: 'test message' })
      await w.find('.input-submit').trigger('click')
      expect(w.emitted('send')).toBeTruthy()
      expect(w.emitted('send')![0]).toEqual(['test message'])
    })

    it('does not emit send when text is empty', async () => {
      const w = createWrapper({ modelValue: '' })
      await w.find('.input-submit').trigger('click')
      expect(w.emitted('send')).toBeFalsy()
    })

    it('trims whitespace before sending', async () => {
      const w = createWrapper({ modelValue: '  hello  ' })
      await w.find('.input-submit').trigger('click')
      expect(w.emitted('send')![0]).toEqual(['hello'])
    })

    it('clears input after sending', async () => {
      const w = createWrapper({ modelValue: 'test' })
      await w.find('.input-submit').trigger('click')
      expect(w.emitted('update:modelValue')).toBeTruthy()
      // Last modelValue update should be empty string
      const updates = w.emitted('update:modelValue')!
      expect(updates[updates.length - 1]).toEqual([''])
    })
  })

  describe('keyboard', () => {
    it('sends on Enter', async () => {
      const w = createWrapper({ modelValue: 'keyboard test' })
      await w.find('textarea').trigger('keydown', { key: 'Enter' })
      expect(w.emitted('send')).toBeTruthy()
      expect(w.emitted('send')![0]).toEqual(['keyboard test'])
    })

    it('does not send on Shift+Enter (allows newline)', async () => {
      const w = createWrapper({ modelValue: 'multi line' })
      await w.find('textarea').trigger('keydown', { key: 'Enter', shiftKey: true })
      expect(w.emitted('send')).toBeFalsy()
    })

    it('does not send on Cmd+Enter', async () => {
      const w = createWrapper({ modelValue: 'test' })
      await w.find('textarea').trigger('keydown', { key: 'Enter', metaKey: true })
      expect(w.emitted('send')).toBeFalsy()
    })

    it('does not send on Ctrl+Enter', async () => {
      const w = createWrapper({ modelValue: 'test' })
      await w.find('textarea').trigger('keydown', { key: 'Enter', ctrlKey: true })
      expect(w.emitted('send')).toBeFalsy()
    })
  })

  describe('v-model', () => {
    it('emits update:modelValue on input', async () => {
      const w = createWrapper({ modelValue: '' })
      await w.find('textarea').setValue('typing')
      expect(w.emitted('update:modelValue')).toBeTruthy()
    })
  })

  describe('surface variants', () => {
    it('applies light surface class by default', () => {
      const w = createWrapper()
      expect(w.find('.input-chat').classes()).toContain('surface-light')
    })

    it('applies dark surface class', () => {
      const w = createWrapper({ surface: 'dark' })
      expect(w.find('.input-chat').classes()).toContain('surface-dark')
    })
  })

  describe('elevated state', () => {
    it('adds is-elevated class when elevated', () => {
      const w = createWrapper({ elevated: true })
      expect(w.find('.input-chat').classes()).toContain('is-elevated')
    })

    it('does not add is-elevated when not elevated', () => {
      const w = createWrapper({ elevated: false })
      expect(w.find('.input-chat').classes()).not.toContain('is-elevated')
    })
  })

  describe('focus', () => {
    it('exposes focus method', () => {
      const w = createWrapper()
      expect(typeof (w.vm as any).focus).toBe('function')
    })
  })
})
