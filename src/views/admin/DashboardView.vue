<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { useAdminAuthStore } from '@/stores/adminAuth'

const admin = useAdminStore()
const adminAuth = useAdminAuthStore()
const router = useRouter()

onMounted(() => admin.fetchEvents())
</script>

<template>
  <div class="tt-animate-fade-in">
    <div class="flex items-center justify-between tt-animate-fade-in-up">
      <div>
        <h1 class="game-heading text-2xl">Dashboard</h1>
        <p v-if="adminAuth.admin" class="game-muted text-sm">
          Signed in as {{ adminAuth.admin.name }} · {{ adminAuth.roleLabel }}
        </p>
      </div>
      <button type="button" class="btn-primary" @click="router.push({ name: 'admin-events-create' })">
        New event
      </button>
    </div>
    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 tt-stagger">
      <div class="card tt-lift cursor-pointer" @click="router.push({ name: 'admin-events' })">
        <p class="game-stat text-3xl">{{ admin.events.length }}</p>
        <p class="game-stat-label">Total events</p>
      </div>
      <div class="card">
        <p class="game-stat text-3xl">
          {{ admin.events.filter((e) => e.status === 'live').length }}
        </p>
        <p class="game-stat-label">Live now</p>
      </div>
    </div>
    <section class="mt-8">
      <h2 class="game-section-title text-base">Recent events</h2>
      <ul class="mt-3 space-y-2 tt-stagger">
        <li
          v-for="ev in admin.events.slice(0, 5)"
          :key="ev.id"
          class="card tt-lift flex cursor-pointer items-center justify-between"
          @click="router.push({ name: 'admin-event-detail', params: { id: ev.id } })"
        >
          <div>
            <p class="font-semibold">{{ ev.name }}</p>
            <p class="text-sm text-slate-400">{{ ev.code }} · {{ ev.mode }}</p>
          </div>
          <span class="game-badge-done rounded-full px-2 py-1 text-xs capitalize">{{ ev.status }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
