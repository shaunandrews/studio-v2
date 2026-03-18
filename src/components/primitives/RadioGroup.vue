<script setup lang="ts">
export interface RadioOption {
	value: string
	label: string
	description?: string
}

withDefaults(defineProps<{
	modelValue: string
	options: RadioOption[]
	name?: string
	surface?: 'light' | 'dark'
}>(), {
	name: 'radio-group',
	surface: 'light',
})

defineEmits<{
	'update:modelValue': [value: string]
}>()
</script>

<template>
	<div class="radio-group" :class="{ 'surface-dark': surface === 'dark' }" role="radiogroup">
		<label
			v-for="option in options"
			:key="option.value"
			class="radio-option"
			:class="{ 'is-selected': modelValue === option.value }"
		>
			<input
				type="radio"
				class="radio-option__input"
				:name="name"
				:value="option.value"
				:checked="modelValue === option.value"
				@change="$emit('update:modelValue', option.value)"
			/>
			<span class="radio-option__indicator" />
			<span class="radio-option__content">
				<span class="radio-option__label">{{ option.label }}</span>
				<span v-if="option.description" class="radio-option__description">{{ option.description }}</span>
			</span>
		</label>
	</div>
</template>

<style scoped>
.radio-group {
	display: flex;
	flex-direction: column;
	gap: var(--space-xxxs);
}

.radio-option {
	display: flex;
	align-items: flex-start;
	gap: var(--space-xs);
	padding: var(--space-xxs) var(--space-xs);
	border-radius: var(--radius-m);
	cursor: pointer;
	transition: background var(--duration-instant) var(--ease-default);
}

.radio-option:hover {
	background: var(--color-frame-hover);
}

.radio-option.is-selected {
	background: var(--color-frame-fill);
}

.radio-option__input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
}

.radio-option__indicator {
	position: relative;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	border: 1.5px solid var(--color-frame-fg-muted);
	flex-shrink: 0;
	margin-block-start: 2px; /* Optical alignment with first line of text */
	transition: border-color var(--duration-fast) var(--ease-default);
}

.radio-option__indicator::after {
	content: '';
	position: absolute;
	inset: 3px;
	border-radius: 50%;
	background: var(--color-frame-theme);
	transform: scale(0);
	transition: transform var(--duration-fast) var(--ease-default);
}

.radio-option.is-selected .radio-option__indicator {
	border-color: var(--color-frame-theme);
}

.radio-option.is-selected .radio-option__indicator::after {
	transform: scale(1);
}

.radio-option__content {
	display: flex;
	flex-direction: column;
	gap: 2px; /* Tight coupling between label and description */
	min-width: 0;
}

.radio-option__label {
	font-size: var(--font-size-m);
	font-weight: var(--font-weight-medium);
	line-height: var(--line-height-tight);
	color: var(--color-frame-fg);
}

.radio-option__description {
	font-size: var(--font-size-s);
	color: var(--color-frame-fg-muted);
	line-height: 1.4;
}

/* ── Dark surface ── */

.radio-group.surface-dark .radio-option:hover {
	background: var(--color-chrome-hover);
}

.radio-group.surface-dark .radio-option.is-selected {
	background: var(--color-chrome-fill);
}

.radio-group.surface-dark .radio-option__indicator {
	border-color: var(--color-chrome-fg-muted);
}

.radio-group.surface-dark .radio-option.is-selected .radio-option__indicator {
	border-color: var(--color-chrome-theme);
}

.radio-group.surface-dark .radio-option__indicator::after {
	background: var(--color-chrome-theme);
}

.radio-group.surface-dark .radio-option__label {
	color: var(--color-chrome-fg);
}

.radio-group.surface-dark .radio-option__description {
	color: var(--color-chrome-fg-muted);
}
</style>
