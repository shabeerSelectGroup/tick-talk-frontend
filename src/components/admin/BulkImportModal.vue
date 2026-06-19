<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
  import: [text: string]
}>()

const text = ref(`Find someone who works in HR
Find someone who speaks 3 languages
Find someone who travelled abroad
Find someone who plays a musical instrument`)

const example = `# One task per line. Optional description after |
Find someone who works in HR
Find someone who speaks 3 languages|Ask what languages they speak
Find someone who travelled abroad`

function useExample() {
  text.value = example
}

function submit() {
  emit('import', text.value)
}
</script>

<template>
  <div
    v-if="open"
    class="game-theme game-modal-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    @click.self="emit('close')"
  >
    <div class="card w-full max-w-lg space-y-4" role="dialog">
      <h2 class="text-lg font-bold">Bulk import tasks</h2>
      <p class="game-stat-label text-sm">
        One task per line. Duplicates are skipped. Use <code class="font-bold text-amber-800">|</code> for an
        optional description.
      </p>
      <textarea v-model="text" class="input min-h-48 font-mono text-sm" />
      <button type="button" class="text-sm text-brand-500" @click="useExample">Load example</button>
      <div class="flex gap-2">
        <button type="button" class="btn-secondary flex-1" @click="emit('close')">Cancel</button>
        <button type="button" class="btn-primary flex-1" @click="submit">Import</button>
      </div>
    </div>
  </div>
</template>
