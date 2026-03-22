import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FlyoutMenu from '../components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '../components/primitives/FlyoutMenu.vue'

const stubs = {
  WPIcon: { template: '<span class="wp-icon-stub" />' },
  Popover: {
    template: `
      <div class="popover-stub">
        <slot name="trigger" :toggle="toggle" :open="isOpen" />
        <div v-if="isOpen" class="popover-panel">
          <slot :resolvedMaxHeight="null" />
        </div>
      </div>
    `,
    data() { return { isOpen: false } },
    methods: {
      toggle() { (this as any).isOpen = !(this as any).isOpen },
      close() { (this as any).isOpen = false },
    },
    expose: ['toggle', 'close', 'open', 'panelRef'],
    computed: {
      open() { return (this as any).isOpen },
      panelRef() { return null },
    },
  },
}

function createWrapper(groups: FlyoutMenuGroup[], props: Record<string, unknown> = {}) {
  return mount(FlyoutMenu, {
    props: { groups, ...props },
    slots: {
      trigger: `<template #trigger="{ toggle }"><button class="test-trigger" @click="toggle">Open</button></template>`,
    },
    global: { stubs },
    attachTo: document.body,
  })
}

const simpleGroups: FlyoutMenuGroup[] = [
  {
    items: [
      { label: 'Cut', action: vi.fn() },
      { label: 'Copy', action: vi.fn() },
      { label: 'Paste', action: vi.fn() },
    ],
  },
]

const groupsWithSections: FlyoutMenuGroup[] = [
  {
    label: 'Edit',
    items: [
      { label: 'Cut', shortcut: '⌘X', action: vi.fn() },
      { label: 'Copy', shortcut: '⌘C', action: vi.fn() },
    ],
  },
  {
    items: [
      { label: 'Delete', destructive: true, action: vi.fn() },
    ],
  },
]

const groupsWithChecks: FlyoutMenuGroup[] = [
  {
    items: [
      { label: 'Option A', checked: true, action: vi.fn() },
      { label: 'Option B', checked: false, action: vi.fn() },
    ],
  },
]

const groupsWithChildren: FlyoutMenuGroup[] = [
  {
    items: [
      {
        label: 'More options',
        children: [
          { label: 'Sub 1', action: vi.fn() },
          { label: 'Sub 2', action: vi.fn() },
        ],
      },
    ],
  },
]

describe('FlyoutMenu', () => {
  describe('rendering', () => {
    it('renders trigger slot', () => {
      const w = createWrapper(simpleGroups)
      expect(w.find('.test-trigger').exists()).toBe(true)
      w.unmount()
    })

    it('does not render menu items when closed', () => {
      const w = createWrapper(simpleGroups)
      expect(w.find('.flyout-item').exists()).toBe(false)
      w.unmount()
    })

    it('renders menu items when opened', async () => {
      const w = createWrapper(simpleGroups)
      await w.find('.test-trigger').trigger('click')
      const items = w.findAll('.flyout-item')
      expect(items).toHaveLength(3)
      expect(items[0].text()).toContain('Cut')
      expect(items[1].text()).toContain('Copy')
      expect(items[2].text()).toContain('Paste')
      w.unmount()
    })
  })

  describe('groups', () => {
    it('renders group labels', async () => {
      const w = createWrapper(groupsWithSections)
      await w.find('.test-trigger').trigger('click')
      expect(w.find('.flyout-group-label').text()).toBe('Edit')
      w.unmount()
    })

    it('renders multiple groups as separate sections', async () => {
      const w = createWrapper(groupsWithSections)
      await w.find('.test-trigger').trigger('click')
      expect(w.findAll('.flyout-group')).toHaveLength(2)
      w.unmount()
    })

    it('renders shortcuts', async () => {
      const w = createWrapper(groupsWithSections)
      await w.find('.test-trigger').trigger('click')
      expect(w.find('.flyout-item-shortcut').text()).toBe('⌘X')
      w.unmount()
    })
  })

  describe('checked items', () => {
    it('shows check marks for checked items', async () => {
      const w = createWrapper(groupsWithChecks)
      await w.find('.test-trigger').trigger('click')
      const checks = w.findAll('.flyout-item-check')
      expect(checks.length).toBeGreaterThan(0)
      // First item is checked, should not be hidden
      expect(checks[0].classes()).not.toContain('flyout-item-check--hidden')
      // Second item is unchecked, should be hidden
      expect(checks[1].classes()).toContain('flyout-item-check--hidden')
      w.unmount()
    })
  })

  describe('destructive items', () => {
    it('applies destructive class', async () => {
      const w = createWrapper(groupsWithSections)
      await w.find('.test-trigger').trigger('click')
      const destructive = w.find('.flyout-item--destructive')
      expect(destructive.exists()).toBe(true)
      expect(destructive.text()).toContain('Delete')
      w.unmount()
    })
  })

  describe('item clicks', () => {
    it('calls item action on click', async () => {
      const action = vi.fn()
      const groups: FlyoutMenuGroup[] = [{
        items: [{ label: 'Do thing', action }],
      }]
      const w = createWrapper(groups)
      await w.find('.test-trigger').trigger('click')
      await w.find('.flyout-item').trigger('click')
      expect(action).toHaveBeenCalledOnce()
      w.unmount()
    })
  })

  describe('submenus', () => {
    it('renders chevron for items with children', async () => {
      const w = createWrapper(groupsWithChildren)
      await w.find('.test-trigger').trigger('click')
      expect(w.find('.flyout-item-chevron').exists()).toBe(true)
      expect(w.find('.flyout-item--parent').exists()).toBe(true)
      w.unmount()
    })
  })

  describe('surface variants', () => {
    it('applies light surface by default', async () => {
      const w = createWrapper(simpleGroups)
      await w.find('.test-trigger').trigger('click')
      expect(w.find('.flyout--light').exists()).toBe(true)
      w.unmount()
    })

    it('applies dark surface', async () => {
      const w = createWrapper(simpleGroups, { surface: 'dark' })
      await w.find('.test-trigger').trigger('click')
      expect(w.find('.flyout--dark').exists()).toBe(true)
      w.unmount()
    })
  })
})
