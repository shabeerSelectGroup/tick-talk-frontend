<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, unwrap } from '@/api/client'
import CopyableField from '@/components/admin/CopyableField.vue'
import QrDisplay from '@/components/QrDisplay.vue'
import { useAdminStore } from '@/stores/admin'
import { getErrorMessage } from '@/utils/errors'

const route = useRoute()
const router = useRouter()
const admin = useAdminStore()
const eventId = computed(() => Number(route.params.id))
const actionError = ref('')

const ev = computed(() => admin.currentEvent)

const links = computed(() => {
  const base = [
    { name: 'admin-event-tasks', label: 'Tasks' },
    { name: 'admin-event-participants', label: 'Participants' },
    { name: 'admin-event-reports', label: 'Reports' },
  ]
  if (ev.value?.mode === 'competition') {
    base.splice(2, 0, { name: 'admin-event-leaderboard', label: 'Leaderboard' })
  }
  return base
})

const modeLabel = computed(() =>
  ev.value?.mode === 'competition' ? 'Competition' : 'Networking'
)

onMounted(() => admin.fetchEvent(eventId.value))

async function startEvent() {
  actionError.value = ''
  try {
    await unwrap(await api.post(`/admin/events/${eventId.value}/start`))
    await admin.fetchEvent(eventId.value)
  } catch (e) {
    actionError.value = getErrorMessage(e)
  }
}

async function endEvent() {
  actionError.value = ''
  try {
    const result = await unwrap<{
      winner: { display_name: string; score: number } | null
      podium: { rank: number; display_name: string; score: number }[]
    }>(await api.post(`/admin/events/${eventId.value}/end`))
    await admin.fetchEvent(eventId.value)
    if (result.podium?.length) {
      const lines = result.podium.map((p) => `#${p.rank} ${p.display_name} (${p.score} pts)`)
      alert(`Event ended\n\nPodium:\n${lines.join('\n')}`)
    } else if (result.winner) {
      alert(`Winner: ${result.winner.display_name} (${result.winner.score} pts)`)
    }
  } catch (e) {
    actionError.value = getErrorMessage(e)
  }
}

function onCopyError() {
  actionError.value = 'Could not copy to clipboard'
}
</script>

<template>
  <div v-if="ev" class="space-y-6 tt-animate-fade-in">
    <header>
      <p class="text-sm font-semibold text-brand-500">{{ ev.code }} · {{ ev.status }} · {{ modeLabel }}</p>
      <h1 class="text-2xl font-bold">{{ ev.name }}</h1>
      <p v-if="ev.description" class="game-muted mt-2">{{ ev.description }}</p>
    </header>

    <!-- Join assets -->
    <section class="card">
      <h2 class="font-black text-amber-900">Join &amp; QR code</h2>
      <p class="game-stat-label mt-1">
        Share the room code or link — each person opens it and enters their own name (not one shared login).
      </p>

      <div class="mt-4 grid gap-6 sm:grid-cols-2">
        <div class="game-qr-panel flex flex-col items-center justify-center p-4">
          <img
            v-if="ev.qr_code_data_url"
            :src="ev.qr_code_data_url"
            alt="Event join QR code"
            class="game-qr-image h-44 w-44 rounded-lg"
          />
          <QrDisplay v-else-if="ev.join_url" :payload="ev.join_url" :size="176" variant="gold" />
        </div>
        <div class="space-y-3">
          <div v-if="ev.code">
            <p class="game-field-label">Event code</p>
            <CopyableField
              :text="ev.code"
              label="Copy event code"
              mono
              large
              @error="onCopyError"
            />
          </div>
          <div v-if="ev.join_url">
            <p class="game-field-label">Join URL</p>
            <CopyableField :text="ev.join_url" label="Copy join URL" mono @error="onCopyError" />
          </div>
          <a
            v-if="ev.settings?.enable_public_wall"
            :href="`/wall/${ev.code}`"
            target="_blank"
            class="btn-primary block w-full text-center text-sm"
          >
            Open public wall
          </a>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 tt-stagger">
      <div class="card text-center">
        <p class="game-stat text-2xl">{{ ev.participant_count ?? 0 }}</p>
        <p class="game-stat-label">Participants</p>
      </div>
      <div class="card text-center">
        <p class="game-stat text-2xl">{{ ev.tasks_count ?? ev.task_count }}</p>
        <p class="game-stat-label">Tasks</p>
      </div>
      <div class="card text-center">
        <p class="game-stat text-2xl">{{ ev.task_count }}</p>
        <p class="game-stat-label">Planned tasks</p>
      </div>
      <div class="card text-center">
        <p class="game-stat text-2xl capitalize">{{ ev.status }}</p>
        <p class="game-stat-label">Status</p>
      </div>
    </div>

    <section v-if="ev.mode === 'competition'" class="card">
      <h2 class="font-black text-amber-900">Competition mode</h2>
      <p class="game-stat-label mt-1">
        {{ ev.settings?.task_completion_points ?? 100 }} pts per task
        <span v-if="ev.settings?.speed_bonus_enabled">
          · speed bonus up to {{ ev.settings.speed_bonus_max_points }} pts
        </span>
      </p>
      <ul class="game-feature-list tt-stagger mt-3 text-sm">
        <li class="game-feature-item">
          <span class="game-feature-item__icon" aria-hidden="true">✓</span>
          Scores &amp; rankings
        </li>
        <li class="game-feature-item">
          <span class="game-feature-item__icon" aria-hidden="true">✓</span>
          Leaderboard
        </li>
        <li class="game-feature-item">
          <span class="game-feature-item__icon" aria-hidden="true">✓</span>
          Awards ({{ ev.settings?.enable_awards ? 'on' : 'off' }})
        </li>
      </ul>
    </section>

    <!-- Mode features -->
    <section v-if="ev.mode === 'networking'" class="card">
      <h2 class="font-black text-amber-900">Networking mode</h2>
      <p class="game-stat-label mt-1">Connections, shared tasks, selfies, live wall — no scores</p>
      <ul class="game-feature-list tt-stagger mt-3 text-sm">
        <li class="game-feature-item">
          <span class="game-feature-item__icon" aria-hidden="true">✓</span>
          Shared tasks
        </li>
        <li class="game-feature-item">
          <span class="game-feature-item__icon" aria-hidden="true">✓</span>
          Selfie verification
        </li>
        <li class="game-feature-item">
          <span class="game-feature-item__icon" aria-hidden="true">✓</span>
          Live wall
        </li>
        <li class="game-feature-item">
          <span class="game-feature-item__icon" aria-hidden="true">✓</span>
          Analytics
        </li>
        <li class="game-feature-item game-feature-item--off">
          <span class="game-feature-item__icon" aria-hidden="true">✗</span>
          Leaderboard &amp; scores
        </li>
      </ul>
    </section>

    <!-- Settings summary -->
    <section v-if="ev.settings" class="card">
      <h2 class="font-black text-amber-900">Settings</h2>
      <ul class="mt-3 grid gap-0 text-sm sm:grid-cols-2 sm:gap-x-4">
        <li class="game-stat-row">
          <span class="game-stat-row__label">Duration</span>
          <span>{{ ev.settings.duration_minutes }} min</span>
        </li>
        <li v-if="ev.mode === 'competition'" class="game-stat-row">
          <span class="game-stat-row__label">Leaderboard</span>
          <span>{{ ev.settings.leaderboard_enabled ? 'On' : 'Off' }}</span>
        </li>
        <li v-if="ev.mode === 'competition'" class="game-stat-row">
          <span class="game-stat-row__label">Task points</span>
          <span>{{ ev.settings.task_completion_points ?? 100 }}</span>
        </li>
        <li
          v-if="ev.mode === 'competition' && ev.settings.speed_bonus_enabled"
          class="game-stat-row"
        >
          <span class="game-stat-row__label">Speed bonus</span>
          <span>Up to {{ ev.settings.speed_bonus_max_points }} pts</span>
        </li>
        <li class="game-stat-row">
          <span class="game-stat-row__label">Awards</span>
          <span>{{ ev.settings.enable_awards ? 'On' : 'Off' }}</span>
        </li>
        <li class="game-stat-row">
          <span class="game-stat-row__label">Live ranking</span>
          <span>{{ ev.settings.show_live_ranking ? 'On' : 'Off' }}</span>
        </li>
        <li class="game-stat-row">
          <span class="game-stat-row__label">Ranking at end only</span>
          <span>{{ ev.settings.show_ranking_only_at_end ? 'On' : 'Off' }}</span>
        </li>
        <li class="game-stat-row">
          <span class="game-stat-row__label">Selfie verification</span>
          <span>{{ ev.settings.enable_selfie_verification ? 'On' : 'Off' }}</span>
        </li>
        <li class="game-stat-row">
          <span class="game-stat-row__label">Public wall</span>
          <span>{{ ev.settings.enable_public_wall ? 'On' : 'Off' }}</span>
        </li>
      </ul>
    </section>



    <p v-if="actionError" class="game-error px-3 py-2 text-sm">{{ actionError }}</p>

    <div class="flex flex-wrap gap-2">
      <button
        v-if="ev.status !== 'ended'"
        type="button"
        class="btn-primary"
        @click="endEvent"
      >
        Finish event
      </button>
    </div>

    <nav class="grid gap-2 sm:grid-cols-2">
      <button
        v-for="link in links"
        :key="link.name"
        type="button"
        class="card text-left"
        @click="router.push({ name: link.name, params: { id: eventId } })"
      >
        {{ link.label }} →
      </button>
    </nav>
  </div>
  <div v-else class="game-muted">Loading event…</div>
</template>
