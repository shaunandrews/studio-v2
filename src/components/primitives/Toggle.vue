<script setup lang="ts">
withDefaults(defineProps<{
	modelValue: boolean
	label?: string
	hint?: string
	size?: 'default' | 'small'
}>(), {
	size: 'default',
})

defineEmits<{
	'update:modelValue': [value: boolean]
}>()
</script>

<template>
	<div class="toggle-field" :class="`toggle-field--${size}`">
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
	width: 36px;
	height: 22px;
	border-radius: var(--radius-full);
	background: var(--color-frame-border);
	flex-shrink: 0;
	transition: background var(--duration-fast) var(--ease-default);
}

.toggle__input:checked + .toggle__track {
	background: var(--color-frame-theme);
}

.toggle__track::before {
	content: '';
	position: absolute;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: var(--color-frame-bg);
	box-shadow:
		0 1px 2px rgba(0, 0, 0, 0.1),
		0 1px 3px rgba(0, 0, 0, 0.06);
	inset-block-start: 3px;
	inset-inline-start: 3px;
	transition: inset-inline-start var(--duration-fast) var(--ease-default);
}

.toggle__input:checked + .toggle__track::before {
	inset-inline-start: 17px;
}

.toggle__label-text {
	font-size: var(--font-size-m);
	font-weight: var(--font-weight-medium);
	line-height: 20px;
	color: var(--color-frame-fg);
}

.toggle-field--small .toggle__label-text {
	font-size: var(--font-size-s);
}

.toggle__hint {
	font-size: var(--font-size-xs);
	color: var(--color-frame-fg-muted);
	line-height: 1.5;
	padding-inline-start: calc(36px + var(--space-s));
}
</style>
