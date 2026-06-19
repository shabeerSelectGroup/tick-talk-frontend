<script setup lang="ts">
import { ref, watch } from 'vue'
import { api, unwrap } from '@/api/client'
import type { EventTask } from '@/types/task'
import { getErrorMessage } from '@/utils/errors'
import { resolveMediaUrl } from '@/utils/mediaUrl'
import { selfieDisplayUrl } from '@/utils/selfieMedia'

export interface TaskSubmission {
  id: number
  participant_id: number
  display_name: string
  company: string | null
  image_url: string
  thumbnail_url: string
  status: string
  uploaded_at: string | null
}

const props = defineProps<{
  open: boolean
  eventId: number
  task: EventTask | null
}>()

const emit = defineEmits<{
  close: []
}>()

const loading = ref(false)
const error = ref('')
const submissions = ref<TaskSubmission[]>([])

watch(
  () => [props.open, props.task?.id] as const,
  async ([open, taskId]) => {
    if (!open || !taskId || !props.task) return
    loading.value = true
    error.value = ''
    submissions.value = []
    try {
      const data = await unwrap<{
        submissions: TaskSubmission[]
        submission_count: number
      }>(await api.get(`/admin/events/${props.eventId}/tasks/${taskId}/submissions`))
      submissions.value = data.submissions
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && task"
      class="game-theme game-modal-backdrop fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      @click.self="emit('close')"
    >
      <div
        class="game-modal-card w-full max-w-3xl"
        role="dialog"
        aria-modal="true"
      >
        <span class="game-modal-card__frame" aria-hidden="true" />
        <header class="game-modal-card__head flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="game-modal-card__eyebrow">Task selfies</p>
            <h2 class="game-modal-card__title">{{ task.title }}</h2>
            <p v-if="task.description" class="mt-1 text-sm opacity-80">{{ task.description }}</p>
          </div>
          <button
            type="button"
            class="game-modal-card__close shrink-0"
            aria-label="Close"
            @click="emit('close')"
          >
            ✕
          </button>
        </header>

        <div class="game-modal-card__body">
          <p v-if="loading" class="text-center text-sm opacity-70">Loading selfies…</p>
          <p v-else-if="error" class="game-error px-3 py-2 text-sm">{{ error }}</p>
          <p v-else-if="!submissions.length" class="game-empty-state py-12 text-center">
            No selfies uploaded for this task yet.
          </p>
          <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <article
              v-for="s in submissions"
              :key="s.id"
              class="game-wall-selfie overflow-hidden"
            >
              <a
                :href="resolveMediaUrl(s.image_url)"
                target="_blank"
                rel="noopener noreferrer"
                class="block aspect-square"
              >
                <img
                  :src="selfieDisplayUrl(s)"
                  :alt="`Selfie by ${s.display_name}`"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
              </a>
              <div class="px-2 py-2">
                <p class="truncate text-sm font-bold">{{ s.display_name }}</p>
                <p v-if="s.company" class="truncate text-xs opacity-70">{{ s.company }}</p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
