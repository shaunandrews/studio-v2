<script setup lang="ts">
import { check } from '@wordpress/icons'
import WPIcon from '@/components/primitives/WPIcon.vue'

withDefaults(defineProps<{
	modelValue: boolean
	label?: string
	hint?: string
	surface?: 'light' | 'dark'
}>(), {
	surface: 'light',
})

defineEmits<{
	'update:modelValue': [value: boolean]
}>()
</script>

<template>
	<div class="checkbox-field" :class="{ 'surface-dark': surface === 'dark' }">
		<label class="checkbox-label">
			<span class="checkbox">
				<input
					type="checkbox"
					class="checkbox__input"
					:checked="modelValue"
					@change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
				/>
				<span class="checkbox__box">
					<WPIcon :icon="check" :size="14" class="checkbox__icon" />
				</span>
			</span>
			<span v-if="label" class="checkbox__label-text">{{ label }}</span>
		</label>
		<div v-if="hint || $slots.hint" class="checkbox__hint">
			<slot name="hint">{{ hint }}</slot>
		</div>
	</div>
</template>

<style scoped>
.checkbox-field {
	display: flex;
	flex-direction: column;
	gap: var(--space-xxxs);
}

.checkbox-label {
	display: flex;
	align-items: center;
	gap: var(--space-s);
	flex: 1;
	min-width: 0;
	cursor: pointer;
}

.checkbox {
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
}

.checkbox__input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.checkbox__input:focus-visible + .checkbox__box {
	outline: 2px solid var(--color-frame-theme);
	outline-offset: 2px;
}

.checkbox__box {
	position: relative;
	width: 16px;
	height: 16px;
	border-radius: var(--radius-s);
	background: var(--color-frame-bg);
	box-shadow: 0 0 0 1px var(--color-frame-border);
	flex-shrink: 0;
	transition: background var(--duration-fast) var(--ease-default),
	            box-shadow var(--duration-fast) var(--ease-default);
	display: flex;
	align-items: center;
	justify-content: center;
}

.checkbox__icon {
	opacity: 0;
	color: #fff;
	transition: opacity var(--duration-fast) var(--ease-default);
}

.checkbox__input:checked + .checkbox__box {
	background: var(--color-frame-theme);
	box-shadow: 0 0 0 1px var(--color-frame-theme);
}

.checkbox__input:checked + .checkbox__box .checkbox__icon {
	opacity: 1;
}

.checkbox__label-text {
	font-size: var(--font-size-m);
	font-weight: var(--font-weight-medium);
	line-height: 22px;
	color: var(--color-frame-fg);
}

.checkbox__hint {
	font-size: var(--font-size-s);
	color: var(--color-frame-fg-muted);
	line-height: 1.5;
	padding-inline-start: calc(16px + var(--space-s));
}

/* ── Dark surface ── */

.checkbox-field.surface-dark .checkbox__label-text {
	color: var(--color-chrome-fg);
}

.checkbox-field.surface-dark .checkbox__box {
	background: var(--color-chrome-bg);
	box-shadow: 0 0 0 1px var(--color-chrome-fg-muted);
}

.checkbox-field.surface-dark .checkbox__input:checked + .checkbox__box {
	background: var(--color-chrome-theme);
	box-shadow: 0 0 0 1px var(--color-chrome-theme);
}

.checkbox-field.surface-dark .checkbox__hint {
	color: var(--color-chrome-fg-muted);
}
</style>
