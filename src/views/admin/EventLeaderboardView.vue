<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, unwrap } from '@/api/client'
import type { AwardEntry, LeaderboardEntry } from '@/types'
import { useAdminStore } from '@/stores/admin'

const route = useRoute()
const admin = useAdminStore()
const eventId = computed(() => Number(route.params.id))
const board = ref<LeaderboardEntry[]>([])
const awards = ref<AwardEntry[]>([])

function medal(rank: number) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return null
}

onMounted(async () => {
  await admin.fetchEvent(eventId.value)
  board.value = await unwrap<LeaderboardEntry[]>(
    await api.get(`/admin/events/${eventId.value}/leaderboard`, { params: { limit: 50 } })
  )
  try {
    awards.value = await unwrap<AwardEntry[]>(await api.get(`/admin/events/${eventId.value}/awards`))
  } catch {
    awards.value = []
  }
})
</script>

<template>
  <div>
    <h1 class="game-heading text-2xl">Leaderboard</h1>
    <p class="game-muted mt-1 text-sm">
      Total score (base + speed bonus per task) → tasks completed → earliest finish time
    </p>

    <ol class="tt-stagger mt-6 space-y-2">
      <li
        v-for="entry in board"
        :key="entry.participant_id"
        class="game-leaderboard-row flex items-center gap-3 p-4"
      >
        <span class="game-leaderboard-rank shrink-0">
          <span v-if="medal(entry.rank)">{{ medal(entry.rank) }}</span>
          <span v-else>{{ entry.rank }}</span>
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate font-bold">{{ entry.display_name }}</p>
          <p class="text-xs opacity-75">
            {{ entry.tasks_completed ?? 0 }} tasks
            <span v-if="entry.is_finished"> · finished</span>
          </p>
        </div>
        <span class="shrink-0 text-lg font-black text-amber-800">{{ entry.score }}</span>
      </li>
      <li v-if="!board.length" class="game-muted py-8 text-center text-sm">
        No scores yet.
      </li>
    </ol>

    <section v-if="awards.length" class="card mt-8">
      <h2 class="font-black text-amber-900">Awards</h2>
      <ul class="mt-3 space-y-2">
        <li
          v-for="a in awards"
          :key="a.id"
          class="game-stat-row text-sm"
        >
          <span>
            <span class="font-black text-amber-800">#{{ a.place }}</span>
            {{ a.display_name }}
          </span>
          <span class="font-bold text-amber-800">{{ a.score }} pts</span>
        </li>
      </ul>
    </section>
  </div>
</template>
