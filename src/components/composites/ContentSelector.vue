<script setup lang="ts">
import { type Directive } from 'vue'
import Toggle from '@/components/primitives/Toggle.vue'
import Dropdown from '@/components/primitives/Dropdown.vue'
import WPIcon from '@/components/primitives/WPIcon.vue'
import {
	useSiteContent,
	filesScopeGroups,
	databaseScopeGroups,
	getNodeState,
	toggleNode,
	toggleExpand,
	type TreeNode,
} from '@/data/useSiteContent'
import {
	file as fileIcon,
	page as pageIcon,
	brush as brushIcon,
	blockTable,
	chevronDownSmall,
} from '@wordpress/icons'

const {
	filesEnabled,
	databaseEnabled,
	filesScope,
	databaseScope,
	fileTree,
	dbTables,
	flatNodes,
	exportType,
	canExport,
	reset,
} = useSiteContent()

// Indeterminate directive
const vIndeterminate: Directive<HTMLInputElement, boolean> = {
	mounted( el, { value } ) {
		el.indeterminate = value
	},
	updated( el, { value } ) {
		el.indeterminate = value
	},
}

function getIcon( node: TreeNode ) {
	if ( node.type === 'theme' ) return brushIcon
	if ( node.type === 'file' ) return pageIcon
	return fileIcon
}

defineExpose( { exportType, canExport, filesEnabled, databaseEnabled, reset } )
</script>

<template>
	<div class="content-selector">
		<!-- Files section -->
		<div class="content-selector__section">
			<div class="content-selector__header">
				<Toggle v-model="filesEnabled" label="Files and folders" />
				<Dropdown
					v-if="filesEnabled"
					v-model="filesScope"
					:groups="filesScopeGroups"
					:show-chevron="true"
					size="small"
					menu-surface="dark"
					placement="below"
					align="end"
				/>
			</div>
			<Transition name="selector-expand">
				<div v-if="filesEnabled && filesScope === 'selected'" class="content-selector__picker">
					<div
						v-for="{ node, depth } in flatNodes"
						:key="node.id"
						class="tree-row"
						:style="{ paddingInlineStart: `${ depth * 12 }px` }"
					>
						<span v-if="node.type !== 'file'" class="tree-row__collapse" @click="toggleExpand( node )">
							<WPIcon :icon="chevronDownSmall" :size="18" :class="{ 'is-collapsed': !node.expanded }" />
						</span>
						<span v-else class="tree-row__collapse-spacer" />
						<input
							type="checkbox"
							class="tree-row__checkbox"
							:checked="getNodeState( node ) === 'checked'"
							v-indeterminate="getNodeState( node ) === 'indeterminate'"
							@change="toggleNode( node )"
						/>
						<WPIcon :icon="getIcon( node )" :size="18" class="tree-row__icon" />
						<span class="tree-row__label">{{ node.label }}</span>
					</div>
				</div>
			</Transition>
		</div>

		<div class="content-selector__divider" />

		<!-- Database section -->
		<div class="content-selector__section">
			<div class="content-selector__header">
				<Toggle v-model="databaseEnabled" label="Database" />
				<Dropdown
					v-if="databaseEnabled"
					v-model="databaseScope"
					:groups="databaseScopeGroups"
					:show-chevron="true"
					size="small"
					menu-surface="dark"
					placement="below"
					align="end"
				/>
			</div>
			<Transition name="selector-expand">
				<div v-if="databaseEnabled && databaseScope === 'selected'" class="content-selector__picker">
					<div v-for="table in dbTables" :key="table.id" class="table-row">
						<input type="checkbox" class="table-row__checkbox" v-model="table.checked" />
						<WPIcon :icon="blockTable" :size="18" class="table-row__icon" />
						<span class="table-row__label">{{ table.label }}</span>
					</div>
				</div>
			</Transition>
		</div>
	</div>
</template>

<style scoped>
.content-selector {
	border: 1px solid var( --color-frame-border );
	border-radius: var( --radius-m );
}

.content-selector__divider {
	height: 1px;
	background: var( --color-frame-border );
}

.content-selector__header {
	display: flex;
	align-items: center;
	gap: var( --space-xs );
	padding: var( --space-s );
	min-height: 50px;
	box-sizing: border-box;
}

.content-selector__picker {
	display: flex;
	flex-direction: column;
	gap: var( --space-xxs );
	padding-inline: var( --space-xs );
	padding-block-end: var( --space-xs );
}

/* Tree row */
.tree-row {
	display: flex;
	align-items: center;
	gap: var( --space-xxs );
}

.tree-row__collapse {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 18px; /* matches icon size */
	height: 18px; /* matches icon size */
	cursor: pointer;
	color: var( --color-frame-fg-muted );
	flex-shrink: 0;
}

.tree-row__collapse:hover {
	color: var( --color-frame-fg );
}

.tree-row__collapse .is-collapsed {
	transform: rotate( -90deg );
}

.tree-row__collapse-spacer {
	width: 18px; /* matches collapse icon size */
	flex-shrink: 0;
}

.tree-row__checkbox,
.table-row__checkbox {
	flex-shrink: 0;
	width: 16px;
	height: 16px;
	accent-color: var( --color-frame-theme );
}

.tree-row__icon,
.table-row__icon {
	flex-shrink: 0;
	color: var( --color-frame-fg-muted );
}

.tree-row__label,
.table-row__label {
	font-size: var( --font-size-m );
	line-height: var( --line-height-tight );
	color: var( --color-frame-fg-muted );
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* Table row */
.table-row {
	display: flex;
	align-items: center;
	gap: var( --space-xxs );
	padding-inline-start: 18px; /* align with tree checkboxes (collapse spacer width) */
}

/* Expand transition */
.selector-expand-enter-active,
.selector-expand-leave-active {
	transition: opacity var( --duration-fast ) var( --ease-default );
	overflow: hidden;
}

.selector-expand-enter-from,
.selector-expand-leave-to {
	opacity: 0;
}
</style>
