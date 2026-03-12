<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/primitives/Button.vue'
import Text from '@/components/primitives/Text.vue'
import TextInput from '@/components/primitives/TextInput.vue'
import { addCustomSkillFromFile, addCustomSkillFromURL } from '@/data/skills'

const emit = defineEmits<{
  added: [skillId: string]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const showUrlInput = ref(false)
const urlValue = ref('')

function triggerUpload() {
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const id = addCustomSkillFromFile(file.name)
  input.value = ''
  if (id) emit('added', id)
}

function toggleUrlInput() {
  showUrlInput.value = !showUrlInput.value
  if (!showUrlInput.value) urlValue.value = ''
}

function submitUrl() {
  const url = urlValue.value.trim()
  if (!url) return
  const id = addCustomSkillFromURL(url)
  urlValue.value = ''
  showUrlInput.value = false
  if (id) emit('added', id)
}
</script>

<template>
  <div class="skill-installer">
    <Text variant="heading-small" color="muted">ADD YOUR OWN</Text>
    <Text variant="body-small" color="muted" class="skill-installer-help">
      Install a custom skill from a local file (.md or .zip) or from a URL to a GitHub repository.
    </Text>

    <div class="skill-installer-actions">
      <Button variant="secondary" size="small" label="Upload" @click="triggerUpload" />
      <Button variant="secondary" size="small" label="URL" @click="toggleUrlInput" />
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".md,.zip"
      class="skill-installer-file-input"
      @change="onFileSelected"
    />

    <div v-if="showUrlInput" class="skill-installer-url">
      <TextInput
        v-model="urlValue"
        placeholder="https://github.com/user/skill-repo"
        @keydown.enter="submitUrl"
      />
      <Button variant="primary" size="large" label="Add" @click="submitUrl" />
    </div>
  </div>
</template>

<style scoped>
.skill-installer {
  display: flex;
  flex-direction: column;
  gap: var(--space-s);
  padding: var(--space-m);
}

.skill-installer-help {
  line-height: var(--line-height-relaxed);
}

.skill-installer-actions {
  display: flex;
  gap: var(--space-xs);
}

.skill-installer-file-input {
  display: none;
}

.skill-installer-url {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
}
</style>
