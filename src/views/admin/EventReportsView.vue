<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, unwrap } from '@/api/client'
import { createExportJob, downloadExportFile, listExportJobs } from '@/api/exports'
import { useAdminStore } from '@/stores/admin'
import { EXPORT_OPTIONS, type ExportJob, type ExportType } from '@/types/reports'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const admin = useAdminStore()
const eventId = computed(() => Number(route.params.id))
const summary = ref<Record<string, unknown> | null>(null)
const jobs = ref<ExportJob[]>([])
const starting = ref<ExportType | null>(null)
const error = ref('')

type TopTaskRow = { title: string; completions: number }
type LeaderboardRow = {
  rank: number
  participant_id: number
  display_name: string
  score: number
  tasks_completed?: number
}

const isNetworking = computed(() => summary.value?.mode === 'networking')
const isCompetition = computed(() => admin.currentEvent?.mode === 'competition')

const topTasks = computed((): TopTaskRow[] => {
  const raw = summary.value?.top_tasks
  return Array.isArray(raw) ? (raw as TopTaskRow[]) : []
})

const exportOptions = computed(() =>
  EXPORT_OPTIONS.filter((o) => !o.competitionOnly || isCompetition.value)
)

let pollTimer: ReturnType<typeof setInterval> | null = null

function formatBytes(n: number | null) {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function exportStatusClass(status: string) {
  if (status === 'completed') return 'game-export-status--done'
  if (status === 'failed') return 'game-export-status--failed'
  if (status === 'processing') return 'game-export-status--pending'
  return 'game-export-status--idle'
}

function formatBadgeClass(format: string) {
  if (format === 'PDF') return 'game-export-format game-export-format--pdf'
  if (format === 'ZIP') return 'game-export-format game-export-format--zip'
  return 'game-export-format game-export-format--excel'
}

async function loadSummary() {
  summary.value = await unwrap(await api.get(`/admin/events/${eventId.value}/reports/summary`))
}

async function loadJobs() {
  jobs.value = await listExportJobs(eventId.value)
}

async function refresh() {
  await admin.fetchEvent(eventId.value)
  await Promise.all([loadSummary(), loadJobs()])
}

async function startExport(type: ExportType) {
  starting.value = type
  error.value = ''
  try {
    const job = await createExportJob(eventId.value, type)
    jobs.value = [job, ...jobs.value.filter((j) => j.id !== job.id)]
    startPolling()
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    starting.value = null
  }
}

async function pollJobs() {
  const active = jobs.value.some((j) => j.status === 'pending' || j.status === 'processing')
  if (!active) {
    stopPolling()
    return
  }
  try {
    jobs.value = await listExportJobs(eventId.value)
  } catch {
    /* ignore poll errors */
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(pollJobs, 2000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function onDownload(job: ExportJob) {
  error.value = ''
  try {
    await downloadExportFile(eventId.value, job)
  } catch (e) {
    error.value = getErrorMessage(e)
  }
}

onMounted(async () => {
  try {
    await refresh()
    if (jobs.value.some((j) => j.status === 'pending' || j.status === 'processing')) {
      startPolling()
    }
  } catch (e) {
    error.value = getErrorMessage(e)
  }
})

onUnmounted(stopPolling)
</script>

<template>
  <div>
    <h1 class="game-heading text-2xl">Reports &amp; exports</h1>
    <p class="game-muted mt-1 text-sm">
      Analytics for this event and downloadable exports (generated in the background).
    </p>

    <p v-if="error" class="game-error mt-4 px-3 py-2 text-sm" role="alert">
      {{ error }}
    </p>

    <!-- Export actions -->
    <section class="card mt-6">
      <h2 class="font-black text-amber-900">Generate export</h2>
      <p class="game-stat-label mt-1">
        Files are built asynchronously — refresh status below or wait for completion.
      </p>
      <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 tt-stagger">
        <button
          v-for="opt in exportOptions"
          :key="opt.type"
          type="button"
          class="game-export-card flex flex-col p-4 text-left transition disabled:opacity-50"
          :disabled="starting === opt.type"
          @click="startExport(opt.type)"
        >
          <span class="inline-flex w-fit rounded-md px-2 py-0.5 text-xs font-bold uppercase" :class="formatBadgeClass(opt.format)">
            {{ opt.format }}
          </span>
          <span class="mt-2 font-bold text-amber-950">{{ opt.label }}</span>
          <span class="game-stat-label mt-1">{{ opt.description }}</span>
          <span v-if="starting === opt.type" class="mt-2 text-xs font-bold text-amber-800">Starting…</span>
        </button>
      </div>
    </section>

    <!-- Recent jobs -->
    <section class="card mt-6">
      <h2 class="font-black text-amber-900">Export history</h2>
      <ul v-if="jobs.length" class="mt-4 space-y-2">
        <li
          v-for="job in jobs"
          :key="job.id"
          class="game-export-history-row flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
        >
          <div class="min-w-0">
            <p class="font-bold text-amber-950">{{ job.export_label }}</p>
            <p class="game-stat-label text-xs">
              <span :class="exportStatusClass(job.status)">{{ job.status }}</span>
              <span v-if="job.file_size_bytes"> · {{ formatBytes(job.file_size_bytes) }}</span>
              <span v-if="job.error_message" class="game-export-status--failed"> — {{ job.error_message }}</span>
            </p>
          </div>
          <button
            v-if="job.status === 'completed'"
            type="button"
            class="btn-primary shrink-0 px-3 py-1.5 text-xs"
            @click="onDownload(job)"
          >
            Download
          </button>
          <span
            v-else-if="job.status === 'pending' || job.status === 'processing'"
            class="text-xs font-semibold text-amber-800"
          >
            Processing…
          </span>
        </li>
      </ul>
      <p v-else class="game-stat-label mt-4 text-sm">No exports yet — generate one above.</p>
    </section>

    <!-- Summary analytics -->
    <section class="mt-8">
      <h2 class="game-section-title text-lg">Event analytics</h2>

      <template v-if="summary && isNetworking">
        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="card text-center">
            <p class="game-stat text-2xl">{{ summary.participants_active }}</p>
            <p class="game-stat-label">Active participants</p>
          </div>
          <div class="card text-center">
            <p class="game-stat text-2xl">{{ summary.total_connections }}</p>
            <p class="game-stat-label">Connections</p>
          </div>
          <div class="card text-center">
            <p class="game-stat text-2xl">{{ summary.tasks_completed }}</p>
            <p class="game-stat-label">Tasks completed</p>
          </div>
          <div class="card text-center">
            <p class="game-stat text-2xl">{{ summary.selfies_uploaded }}</p>
            <p class="game-stat-label">Selfies</p>
          </div>
        </div>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
          <section class="card">
            <h3 class="font-black text-amber-900">Engagement</h3>
            <ul class="mt-3 space-y-0 text-sm">
              <li class="game-stat-row">
                <span class="game-stat-row__label">Avg connections / person</span>
                <span>{{ summary.avg_connections_per_participant }}</span>
              </li>
              <li class="game-stat-row">
                <span class="game-stat-row__label">Connection rate</span>
                <span>{{ summary.connection_rate }}</span>
              </li>
              <li class="game-stat-row">
                <span class="game-stat-row__label">Selfies pending review</span>
                <span>{{ summary.selfies_pending_review }}</span>
              </li>
            </ul>
          </section>
        </div>

        <section v-if="topTasks.length" class="card mt-6">
          <h3 class="font-black text-amber-900">Top completed tasks</h3>
          <ul class="mt-3 space-y-2">
            <li
              v-for="(t, i) in topTasks"
              :key="i"
              class="game-stat-row text-sm"
            >
              <span class="font-medium">{{ t.title }}</span>
              <span class="font-black text-amber-800">{{ t.completions }}</span>
            </li>
          </ul>
        </section>
      </template>

      <template v-else-if="summary">
        <div class="mt-4 grid gap-4 sm:grid-cols-3">
          <div class="card text-center">
            <p class="game-stat text-2xl">{{ summary.participant_count }}</p>
            <p class="game-stat-label">Participants</p>
          </div>
          <div class="card text-center">
            <p class="game-stat text-2xl">{{ summary.total_matches }}</p>
            <p class="game-stat-label">Scans</p>
          </div>
          <div class="card text-center">
            <p class="game-stat text-2xl">{{ summary.total_tasks_completed }}</p>
            <p class="game-stat-label">Tasks completed</p>
          </div>
        </div>

        <section
          v-if="(summary.leaderboard_top as LeaderboardRow[])?.length"
          class="card mt-6"
        >
          <h3 class="font-black text-amber-900">Leaderboard top 5</h3>
          <ul class="mt-3 space-y-2">
            <li
              v-for="row in (summary.leaderboard_top as LeaderboardRow[])"
              :key="row.participant_id"
              class="game-leaderboard-row flex items-center gap-3 p-3"
            >
              <span class="game-leaderboard-rank shrink-0 text-sm">{{ row.rank }}</span>
              <span class="min-w-0 flex-1 truncate font-bold">{{ row.display_name }}</span>
              <span class="shrink-0 font-black text-amber-800">
                {{ row.score }} · {{ row.tasks_completed ?? 0 }} tasks
              </span>
            </li>
          </ul>
        </section>
      </template>
    </section>
  </div>
</template>
