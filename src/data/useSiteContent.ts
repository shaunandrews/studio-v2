import { ref, computed, watch } from 'vue'

// ── Interfaces ──

export interface TreeNode {
  id: string
  label: string
  type: 'folder' | 'file' | 'theme'
  children?: TreeNode[]
  checked: boolean
  expanded: boolean
}

export interface TableEntry {
  id: string
  label: string
  checked: boolean
}

export interface FlatNode {
  node: TreeNode
  depth: number
}

export type CheckState = 'checked' | 'unchecked' | 'indeterminate'

// ── Seed data factories ──

export function createTree(): TreeNode[] {
  return [
    {
      id: 'wp-content',
      label: 'wp-content/',
      type: 'folder',
      expanded: true,
      checked: true,
      children: [
        {
          id: 'mu-plugins',
          label: 'mu-plugins/',
          type: 'folder',
          expanded: true,
          checked: true,
          children: [
            { id: 'mu-index', label: 'index.php', type: 'file', checked: true, expanded: false },
            { id: 'mu-woo', label: 'woocommerce-analytics-proxy-speed-module.php', type: 'file', checked: true, expanded: false },
          ],
        },
        {
          id: 'themes',
          label: 'themes/',
          type: 'folder',
          expanded: true,
          checked: true,
          children: [
            { id: 'tt4', label: 'twentytwentyfour/', type: 'theme', checked: true, expanded: false },
            { id: 'tt5', label: 'twentytwentyfive/', type: 'theme', checked: true, expanded: false },
            { id: 'tt3', label: 'twentytwentythree/', type: 'theme', checked: true, expanded: false },
            { id: 'themes-index', label: 'index.php', type: 'file', checked: true, expanded: false },
          ],
        },
        { id: 'plugins', label: 'plugins/', type: 'folder', checked: true, expanded: false },
        { id: 'uploads', label: 'uploads/', type: 'folder', checked: true, expanded: false },
        { id: 'content-index', label: 'index.php', type: 'file', checked: true, expanded: false },
      ],
    },
  ]
}

export function createTables(): TableEntry[] {
  return [
    { id: 'wp-commentmeta', label: 'wp_commentmeta', checked: true },
    { id: 'wp-comments', label: 'wp_comments', checked: true },
    { id: 'wp-links', label: 'wp_links', checked: true },
    { id: 'wp-options', label: 'wp_options', checked: true },
    { id: 'wp-postmeta', label: 'wp_postmeta', checked: true },
    { id: 'wp-posts', label: 'wp_posts', checked: true },
    { id: 'wp-term-relationships', label: 'wp_term_relationships', checked: true },
    { id: 'wp-term-taxonomy', label: 'wp_term_taxonomy', checked: true },
    { id: 'wp-termmeta', label: 'wp_termmeta', checked: true },
    { id: 'wp-terms', label: 'wp_terms', checked: true },
    { id: 'wp-usermeta', label: 'wp_usermeta', checked: true },
    { id: 'wp-users', label: 'wp_users', checked: true },
  ]
}

// ── Tree checkbox logic ──

export function getNodeState(node: TreeNode): CheckState {
  if (!node.children?.length) return node.checked ? 'checked' : 'unchecked'
  const states = node.children.map(getNodeState)
  if (states.every(s => s === 'checked')) return 'checked'
  if (states.every(s => s === 'unchecked')) return 'unchecked'
  return 'indeterminate'
}

export function setAllChecked(node: TreeNode, checked: boolean) {
  node.checked = checked
  node.children?.forEach(child => setAllChecked(child, checked))
}

export function toggleNode(node: TreeNode) {
  if (!node.children?.length) {
    node.checked = !node.checked
  } else {
    const newChecked = getNodeState(node) !== 'checked'
    setAllChecked(node, newChecked)
  }
}

export function toggleExpand(node: TreeNode) {
  node.expanded = !node.expanded
}

// ── Static dropdown data ──

export const filesScopeGroups = [{ label: '', options: [
  { value: 'all', label: 'All files and folders' },
  { value: 'selected', label: 'Selected files and folders' },
] }]

export const databaseScopeGroups = [{ label: '', options: [
  { value: 'all', label: 'All tables' },
  { value: 'selected', label: 'Selected tables' },
] }]

// ── Composable ──

export function useSiteContent() {
  const filesEnabled = ref(true)
  const databaseEnabled = ref(true)
  const filesScope = ref<'all' | 'selected'>('all')
  const databaseScope = ref<'all' | 'selected'>('all')
  const fileTree = ref<TreeNode[]>(createTree())
  const dbTables = ref<TableEntry[]>(createTables())

  // Flat tree for rendering (walks tree, respects expanded state)
  const flatNodes = computed((): FlatNode[] => {
    const result: FlatNode[] = []
    function walk(nodes: TreeNode[], depth: number) {
      for (const node of nodes) {
        result.push({ node, depth })
        if (node.children?.length && node.expanded) {
          walk(node.children, depth + 1)
        }
      }
    }
    walk(fileTree.value, 0)
    return result
  })

  // Reset checked state when switching to "selected" scope
  watch(filesScope, (scope) => {
    if (scope === 'selected') {
      fileTree.value.forEach(node => setAllChecked(node, true))
    }
  })

  watch(databaseScope, (scope) => {
    if (scope === 'selected') {
      dbTables.value.forEach(t => t.checked = true)
    }
  })

  // Derived export type
  const exportType = computed<'full' | 'database' | 'files'>(() => {
    if (filesEnabled.value && databaseEnabled.value) return 'full'
    if (!filesEnabled.value && databaseEnabled.value) return 'database'
    return 'files'
  })

  const canExport = computed(() => filesEnabled.value || databaseEnabled.value)

  function reset() {
    filesEnabled.value = true
    databaseEnabled.value = true
    filesScope.value = 'all'
    databaseScope.value = 'all'
    fileTree.value = createTree()
    dbTables.value = createTables()
  }

  return {
    filesEnabled,
    databaseEnabled,
    filesScope,
    databaseScope,
    fileTree,
    dbTables,
    flatNodes,
    getNodeState,
    toggleNode,
    toggleExpand,
    exportType,
    canExport,
    reset,
  }
}
