<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { EventTask, TaskCreatePayload, TaskType } from '@/types/task'

const props = defineProps<{
  open: boolean
  task?: EventTask | null
  isCompetition: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [payload: TaskCreatePayload]
}>()

const form = reactive({
  title: '',
  description: '',
  type: 'manual' as TaskType,
  points: 0,
  is_required: true,
})

const error = ref('')

watch(
  () => [props.open, props.task] as const,
  ([open, task]) => {
    if (!open) return
    error.value = ''
    if (task) {
      form.title = task.title
      form.description = task.description ?? ''
      form.type = task.type
      form.points = task.points
      form.is_required = task.is_required
    } else {
      form.title = ''
      form.description = ''
      form.type = 'manual'
      form.points = 0
      form.is_required = true
    }
  }
)

function submit() {
  if (form.title.trim().length < 3) {
    error.value = 'Title must be at least 3 characters'
    return
  }
  emit('save', {
    title: form.title.trim(),
    description: form.description.trim() || null,
    type: form.type,
    points: props.isCompetition ? form.points : 0,
    is_required: form.is_required,
  })
}
</script>

<template>
  <div
    v-if="open"
    class="game-theme game-modal-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    @click.self="emit('close')"
  >
    <div class="card w-full max-w-lg space-y-4" role="dialog">
      <h2 class="text-lg font-bold">{{ task ? 'Edit task' : 'Add task' }}</h2>

      <div>
        <label class="game-label">Title *</label>
        <input v-model="form.title" class="input mt-1" placeholder="Find someone who works in HR" />
      </div>
      <div>
        <label class="game-label">Description</label>
        <textarea
          v-model="form.description"
          class="input mt-1 min-h-20 resize-none"
          placeholder="Optional instructions"
        />
      </div>
      <div>
        <label class="game-label">Type</label>
        <select v-model="form.type" class="input mt-1">
          <option value="manual">Manual (networking prompt)</option>
          <option value="scan">Meet &amp; selfie (no QR)</option>
          <option value="selfie">Selfie</option>
          <option value="quiz">Quiz</option>
        </select>
      </div>
      <div v-if="isCompetition">
        <label class="game-label">Points</label>
        <input v-model.number="form.points" type="number" min="0" class="input mt-1 w-28" />
      </div>
      <label class="flex items-center gap-2 text-sm">
        <input v-model="form.is_required" type="checkbox" class="h-4 w-4 rounded" />
        Required task
      </label>

      <p v-if="error" class="game-error px-3 py-2 text-sm">{{ error }}</p>

      <div class="flex gap-2">
        <button type="button" class="btn-secondary flex-1" @click="emit('close')">Cancel</button>
        <button type="button" class="btn-primary flex-1" @click="submit">Save</button>
      </div>
    </div>
  </div>
</template>
