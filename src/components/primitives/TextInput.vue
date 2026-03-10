<script setup lang="ts">
defineProps<{
	modelValue: string
	label?: string
	type?: 'text' | 'email' | 'password' | 'url'
	placeholder?: string
	hint?: string
	id?: string
}>()

defineEmits<{
	'update:modelValue': [value: string]
}>()
</script>

<template>
	<div class="text-input">
		<label v-if="label" class="text-input__label" :for="id">{{ label }}</label>
		<div class="text-input__wrapper">
			<input
				:id="id"
				:value="modelValue"
				:type="type ?? 'text'"
				:placeholder="placeholder"
				class="text-input__field"
				:class="{ 'text-input__field--has-suffix': $slots.suffix }"
				@input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
			/>
			<div v-if="$slots.suffix" class="text-input__suffix">
				<slot name="suffix" />
			</div>
		</div>
		<div v-if="hint || $slots.hint" class="text-input__hint">
			<slot name="hint">{{ hint }}</slot>
		</div>
	</div>
</template>

<style scoped>
.text-input__label {
	display: block;
	font-size: var(--font-size-s);
	font-weight: var(--font-weight-semibold);
	color: var(--color-frame-fg);
	margin-block-end: var(--space-xs);
}

.text-input__wrapper {
	position: relative;
}

.text-input__field {
	display: block;
	width: 100%;
	font-family: inherit;
	font-size: var(--font-size-s);
	color: var(--color-frame-fg);
	background: var(--color-frame-bg);
	border: 1px solid var(--color-frame-border);
	border-radius: var(--radius-s);
	padding: var(--space-xs);
	outline: none;
	transition: border-color var(--duration-instant) var(--ease-default);
	box-sizing: border-box;
}

.text-input__field::placeholder {
	color: var(--color-frame-fg-muted);
}

.text-input__field:hover {
	border-color: var(--color-frame-fg-muted);
}

.text-input__field:focus-visible {
	border-color: var(--color-frame-theme);
	box-shadow: 0 0 0 1px var(--color-frame-theme);
}

.text-input__field--has-suffix {
	padding-inline-end: var(--space-xl);
}

.text-input__suffix {
	position: absolute;
	inset-block-start: 50%;
	inset-inline-end: var(--space-xxs);
	transform: translateY(-50%);
	display: flex;
	align-items: center;
}

.text-input__hint {
	font-size: var(--font-size-xs);
	color: var(--color-frame-fg-muted);
	margin: var(--space-xxs) 0 0;
	line-height: 1.5;
}
</style>
