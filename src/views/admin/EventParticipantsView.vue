<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/api/client'
import { useAdminStore } from '@/stores/admin'
import { getErrorMessage } from '@/utils/errors'
import type { ApiResponse } from '@/types'

type RosterRow = {
  id: number
  display_name: string
  email?: string | null
  company?: string | null
  score?: number
  signed_in?: boolean
}

const route = useRoute()
const admin = useAdminStore()
const eventId = computed(() => Number(route.params.id))
const participants = ref<RosterRow[]>([])
const rosterTotal = ref(0)
const loading = ref(false)
const error = ref('')

const joinHint = computed(() => {
  const ev = admin.currentEvent
  if (!ev || ev.id !== eventId.value || !ev.code) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/join/${ev.code}`
})

function isValidEventId(): boolean {
  return Number.isFinite(eventId.value) && eventId.value > 0
}

async function loadRoster() {
  if (!isValidEventId()) {
    error.value = 'Invalid event. Open Participants from the event page in admin.'
    participants.value = []
    rosterTotal.value = 0
    return
  }

  loading.value = true
  error.value = ''
  const all: RosterRow[] = []
  let page = 1
  const perPage = 100
  try {
    while (true) {
      const response = await api.get<ApiResponse<RosterRow[]>>(
        `/admin/events/${eventId.value}/participants`,
        { params: { page, per_page: perPage } }
      )
      const body = response.data
      if (!body.success || body.data === null) {
        throw new Error(body.error?.message ?? 'Could not load roster')
      }
      all.push(...body.data)
      const total = body.meta?.total ?? all.length
      rosterTotal.value = total
      if (all.length >= total || body.data.length < perPage) break
      page += 1
    }
    participants.value = all
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function refreshPage() {
  if (!isValidEventId()) return
  try {
    await admin.fetchEvent(eventId.value)
  } catch (e) {
    error.value = getErrorMessage(e)
  }
  await loadRoster()
}

onMounted(() => refreshPage())

watch(eventId, () => refreshPage())
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold">Participants</h1>
      <p class="mt-1 text-sm text-slate-400">
        Everyone who joins this event on their phone appears here automatically.
      </p>
      <p v-if="joinHint" class="mt-2 font-mono text-sm text-brand-500">{{ joinHint }}</p>
    </header>

    <div
      v-if="error"
      class="rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      <p>{{ error }}</p>
      <button type="button" class="mt-2 text-xs underline" @click="refreshPage">Retry loading roster</button>
    </div>

    <section>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h2 class="font-semibold">
          Roster
          <span class="text-slate-500">({{ rosterTotal || participants.length }})</span>
        </h2>
        <button type="button" class="text-xs text-brand-500 underline" :disabled="loading" @click="loadRoster">
          {{ loading ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
      <p v-if="loading && !participants.length" class="mt-4 text-slate-400">Loading roster…</p>
      <ul v-else class="mt-4 space-y-2 tt-stagger">
        <li
          v-for="p in participants"
          :key="p.id"
          class="card flex flex-wrap items-center justify-between gap-2"
        >
          <div>
            <p class="font-bold">{{ p.display_name }}</p>
            <p v-if="p.company" class="game-stat-label">{{ p.company }}</p>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="p.signed_in ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100/80 text-amber-900'"
            >
              {{ p.signed_in ? 'Signed in' : 'Not signed in' }}
            </span>
            <span v-if="p.score != null && p.score > 0" class="font-black text-amber-800">{{ p.score }} pts</span>
          </div>
        </li>
        <li v-if="!participants.length && !loading" class="text-slate-400">
          No one on the roster yet. Share the join link — players appear here when they sign in.
        </li>
      </ul>
    </section>
  </div>
</template>
