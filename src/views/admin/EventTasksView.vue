<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import BulkImportModal from '@/components/admin/BulkImportModal.vue'
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
const bulkOpen = ref(false)
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

async function move(taskId: number, direction: 'up' | 'down') {
  const ids = tasksStore.moveTask(taskId, direction)
  if (!ids) return
  try {
    await tasksStore.reorderTasks(eventId.value, ids)
  } catch (e) {
    error.value = getErrorMessage(e)
  }
}

async function handleBulkImport(text: string) {
  error.value = ''
  try {
    const result = await tasksStore.bulkImport(eventId.value, text)
    bulkOpen.value = false
    success.value = `Imported ${result.created} tasks (${result.skipped_duplicates} duplicates skipped)`
    if (result.errors.length) {
      error.value = result.errors.join('; ')
    }
  } catch (e) {
    error.value = getErrorMessage(e)
  }
}
</script>

<template>
  <div>
    <AdminPageHeader
      title="Tasks"
      :subtitle="`Shared list for all participants · ${tasksStore.tasks.length} tasks`"
    >
      <template #actions>
        <button type="button" class="admin-btn-secondary" @click="bulkOpen = true">
          Bulk upload
        </button>
        <button type="button" class="admin-btn-primary" @click="openCreate">Add task</button>
      </template>
    </AdminPageHeader>

    <p v-if="success" class="admin-alert admin-alert--success mb-4">{{ success }}</p>
    <p v-if="error" class="admin-alert admin-alert--error mb-4">{{ error }}</p>

    <div class="admin-panel">
      <div v-if="tasksStore.loading" class="admin-empty">Loading tasks…</div>
      <div v-else-if="!tasksStore.tasks.length" class="admin-empty">
        No tasks yet. Add networking prompts like “Find someone who works in HR”.
      </div>
      <div v-else class="admin-table-wrap border-0 shadow-none">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="w-16">Order</th>
              <th>Task</th>
              <th>Type</th>
              <th>Progress</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(task, index) in tasksStore.tasks" :key="task.id">
              <td>
                <div class="flex flex-col gap-0.5">
                  <button
                    type="button"
                    class="admin-btn-ghost !min-h-7 !px-2"
                    :disabled="index === 0"
                    @click="move(task.id, 'up')"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="admin-btn-ghost !min-h-7 !px-2"
                    :disabled="index === tasksStore.tasks.length - 1"
                    @click="move(task.id, 'down')"
                  >
                    ↓
                  </button>
                </div>
              </td>
              <td>
                <button type="button" class="text-left" @click="openSubmissions(task)">
                  <p class="font-semibold text-indigo-600 hover:text-indigo-800">{{ task.title }}</p>
                  <p v-if="task.description" class="text-xs text-slate-500">{{ task.description }}</p>
                </button>
              </td>
              <td class="capitalize text-slate-600">
                {{ task.type }}
                <span v-if="isCompetition && task.points" class="text-slate-400"> · {{ task.points }} pts</span>
              </td>
              <td class="text-slate-600">
                {{ task.completed_count }}/{{ task.assigned_count }} done
                · {{ task.selfie_count ?? 0 }} selfies
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button type="button" class="admin-btn-ghost" @click="openSubmissions(task)">Selfies</button>
                  <button type="button" class="admin-btn-ghost" @click="openEdit(task)">Edit</button>
                  <button type="button" class="admin-btn-ghost !text-red-600" @click="handleDelete(task)">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <TaskFormModal
      :open="formOpen"
      :task="editingTask"
      :is-competition="isCompetition"
      @close="formOpen = false"
      @save="handleSave"
    />
    <BulkImportModal :open="bulkOpen" @close="bulkOpen = false" @import="handleBulkImport" />
    <TaskSubmissionsModal
      :open="submissionsOpen"
      :event-id="eventId"
      :task="submissionsTask"
      @close="submissionsOpen = false"
    />
  </div>
</template>
