<script setup lang="ts">
withDefaults(defineProps<{
	modelValue: boolean
	label?: string
	hint?: string
	size?: 'default' | 'small'
	surface?: 'light' | 'dark'
}>(), {
	size: 'default',
	surface: 'light',
})

defineEmits<{
	'update:modelValue': [value: boolean]
}>()
</script>

<template>
	<div class="toggle-field" :class="[`toggle-field--${size}`, { 'surface-dark': surface === 'dark' }]">
		<label class="toggle-label">
			<span class="toggle">
				<input
					type="checkbox"
					class="toggle__input"
					:checked="modelValue"
					@change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
				/>
				<span class="toggle__track" />
			</span>
			<span v-if="label" class="toggle__label-text">{{ label }}</span>
		</label>
		<div v-if="hint || $slots.hint" class="toggle__hint">
			<slot name="hint">{{ hint }}</slot>
		</div>
	</div>
</template>

<style scoped>
.toggle-field {
	display: flex;
	flex-direction: column;
	gap: var(--space-xxxs);
}

.toggle-label {
	display: flex;
	align-items: center;
	gap: var(--space-s);
	flex: 1;
	min-width: 0;
	cursor: pointer;
}

.toggle {
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
}

.toggle__input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.toggle__track {
	position: relative;
	width: 32px;
	height: 16px;
	border-radius: var(--radius-full);
	background: var(--color-frame-fill);
	box-shadow: 0 0 0 1px var(--color-frame-fg-muted);
	flex-shrink: 0;
	transition: background var(--duration-fast) var(--ease-default);
}

.toggle__input:checked + .toggle__track {
	background: var(--color-frame-theme);
	box-shadow: 0 0 0 1px var(--color-frame-theme);
}

.toggle__track::before {
	content: '';
	position: absolute;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: var(--color-frame-fg-muted);
	box-shadow:
		0 1px 2px rgba(0, 0, 0, 0.1),
		0 1px 3px rgba(0, 0, 0, 0.06);
	inset-block-start: 1px;
	inset-inline-start: 1px;
	transition: inset-inline-start var(--duration-fast) var(--ease-default);
}

.toggle__input:checked + .toggle__track::before {
	inset-inline-start: 17px;
	background: var(--color-frame-bg);
}

.toggle__label-text {
	font-size: var(--font-size-m);
	font-weight: var(--font-weight-medium);
	line-height: 22px;
	color: var(--color-frame-fg);
}

.toggle-field--small .toggle__label-text {
	font-size: var(--font-size-m);
}

.toggle__hint {
	font-size: var(--font-size-s);
	color: var(--color-frame-fg-muted);
	line-height: 1.5;
	padding-inline-start: calc(32px + var(--space-s));
}

/* ── Dark surface ── */

.toggle-field.surface-dark .toggle__label-text {
	color: var(--color-chrome-fg);
}

.toggle-field.surface-dark .toggle__track {
	background: var(--color-chrome-hover);
	box-shadow: 0 0 0 1px var(--color-chrome-fg-muted);
}

.toggle-field.surface-dark .toggle__input:checked + .toggle__track {
	background: var(--color-chrome-theme);
	box-shadow: 0 0 0 1px var(--color-chrome-theme);
}

.toggle-field.surface-dark .toggle__track::before {
	background: var(--color-chrome-fg-muted);
}

.toggle-field.surface-dark .toggle__input:checked + .toggle__track::before {
	background: var(--color-chrome-fg);
}

.toggle-field.surface-dark .toggle__hint {
	color: var(--color-chrome-fg-muted);
}
</style>
