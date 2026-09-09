<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import TaskFormModal from '@/components/admin/TaskFormModal.vue'
import TaskSubmissionsModal from '@/components/admin/TaskSubmissionsModal.vue'
import { useAdminStore } from '@/stores/admin'
import { useAdminTasksStore } from '@/stores/adminTasks'
import type { EventTask, TaskCreatePayload } from '@/types/task'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const admin = useAdminStore()
const tasksStore = useAdminTasksStore()

const eventId = computed(() => Number(route.params.id))
const error = ref('')
const success = ref('')
const formOpen = ref(false)
const editingTask = ref<EventTask | null>(null)
const submissionsTask = ref<EventTask | null>(null)
const submissionsOpen = ref(false)
const saving = ref(false)

const isCompetition = computed(() => admin.currentEvent?.mode === 'competition')

onMounted(async () => {
  await admin.fetchEvent(eventId.value)
  await tasksStore.fetchTasks(eventId.value)
})

function openCreate() {
  editingTask.value = null
  formOpen.value = true
}

function openEdit(task: EventTask) {
  editingTask.value = task
  formOpen.value = true
}

function openSubmissions(task: EventTask) {
  submissionsTask.value = task
  submissionsOpen.value = true
}

async function handleSave(payload: TaskCreatePayload) {
  saving.value = true
  error.value = ''
  try {
    if (editingTask.value) {
      await tasksStore.updateTask(eventId.value, editingTask.value.id, payload)
      success.value = 'Task updated'
    } else {
      await tasksStore.createTask(eventId.value, payload)
      success.value = 'Task added and assigned to all participants'
    }
    formOpen.value = false
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    saving.value = false
  }
}

async function handleDelete(task: EventTask) {
  if (!confirm(`Delete "${task.title}"?`)) return
  error.value = ''
  try {
    await tasksStore.deleteTask(eventId.value, task.id)
    success.value = 'Task deleted'
  } catch (e) {
    error.value = getErrorMessage(e)
  }
}

</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">Tasks</h1>
        <p class="text-sm text-slate-400">
          Shared list for all participants · {{ tasksStore.tasks.length }} tasks
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn-primary text-sm" @click="openCreate">
          Add task
        </button>
      </div>
    </div>

    <p v-if="success" class="rounded-lg bg-brand-600/20 px-3 py-2 text-sm text-brand-500">{{ success }}</p>
    <p v-if="error" class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{{ error }}</p>

    <p v-if="tasksStore.loading" class="text-slate-400">Loading tasks…</p>

    <ul v-else class="space-y-3">
      <li
        v-for="task in tasksStore.tasks"
        :key="task.id"
        class="card flex gap-3"
      >
        <button
          type="button"
          class="min-w-0 flex-1 text-left"
          @click="openSubmissions(task)"
        >
          <p class="font-bold text-amber-950 hover:text-amber-800">{{ task.title }}</p>
          <p v-if="task.description" class="game-stat-label mt-1">{{ task.description }}</p>
          <p class="game-stat-label mt-2 text-xs">
            {{ task.type }}
            <span v-if="isCompetition && task.points"> · {{ task.points }} pts</span>
            · {{ task.completed_count }}/{{ task.assigned_count }} completed
            · {{ task.selfie_count ?? 0 }} selfies
          </p>
        </button>
        <div class="flex shrink-0 flex-col gap-2">
          <button type="button" class="text-sm font-bold text-amber-800" @click="openSubmissions(task)">
            View selfies
          </button>
          <button type="button" class="text-sm font-semibold text-amber-900/80" @click="openEdit(task)">
            Edit
          </button>
          <button type="button" class="text-sm font-semibold text-red-800" @click="handleDelete(task)">
            Delete
          </button>
        </div>
      </li>
    </ul>

    <p v-if="!tasksStore.loading && !tasksStore.tasks.length" class="text-center text-slate-500 py-8">
      No tasks yet. Add networking prompts like “Find someone who works in HR”.
    </p>

    <TaskFormModal
      :open="formOpen"
      :task="editingTask"
      :is-competition="isCompetition"
      @close="formOpen = false"
      @save="handleSave"
    />
    <TaskSubmissionsModal
      :open="submissionsOpen"
      :event-id="eventId"
      :task="submissionsTask"
      @close="submissionsOpen = false"
    />
  </div>
</template>
