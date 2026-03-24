<script setup lang="ts">
import { ref, computed } from 'vue'
import FlyoutMenu from '@/components/primitives/FlyoutMenu.vue'
import type { FlyoutMenuGroup } from '@/components/primitives/FlyoutMenu.vue'

export interface UrlInputPage {
	slug: string
	title: string
}

const props = defineProps<{
	modelValue: string
	placeholder?: string
	pages?: UrlInputPage[]
}>()

const emit = defineEmits<{
	'navigate': [slug: string]
}>()

const inputRef = ref<HTMLDivElement | null>(null)

const menuRef = ref<InstanceType<typeof FlyoutMenu> | null>(null)
const menuWidth = ref<string | undefined>(undefined)

function onToggle() {
	menuWidth.value = inputRef.value ? `${inputRef.value.offsetWidth}px` : undefined
	menuRef.value?.toggle()
}

const menuGroups = computed<FlyoutMenuGroup[]>(() => {
	if (!props.pages?.length) return []
	return [{
		items: props.pages.map(page => ({
			label: page.title,
			detail: page.slug,
			action: () => emit('navigate', page.slug),
		})),
	}]
})
</script>

<template>
	<FlyoutMenu
		ref="menuRef"
		:groups="menuGroups"
		placement="below"
		align="start"
		:width="menuWidth"
		class="url-input-anchor"
	>
		<template #trigger>
			<div ref="inputRef" class="url-input" @click="onToggle">
				<input
					:value="modelValue"
					type="text"
					:placeholder="placeholder"
					readonly
					class="url-input__field"
				/>
			</div>
		</template>
	</FlyoutMenu>
</template>

<style scoped>
.url-input-anchor {
	flex: 1;
	min-width: 0;
}

.url-input {
	min-width: 0;
	flex: 1;
}

.url-input__field {
	display: block;
	width: 100%;
	font-family: inherit;
	font-size: var(--font-size-s);
	color: var(--color-frame-fg-muted);
	background: var(--color-frame-fill);
	border: 1px solid transparent;
	border-radius: var(--radius-s);
	height: 28px;
	padding: 0 var(--space-xs);
	outline: none;
	cursor: pointer;
	transition:
		background var(--duration-instant) var(--ease-default),
		border-color var(--duration-instant) var(--ease-default);
	box-sizing: border-box;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.url-input__field:hover {
	background: var(--color-frame-hover);
}

.url-input__field::placeholder {
	color: var(--color-frame-fg-disabled);
}
</style>
