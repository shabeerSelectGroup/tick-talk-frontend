<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const admin = useAdminStore()
const router = useRouter()

onMounted(() => admin.fetchEvents())
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Events</h1>
      <button type="button" class="btn-primary" @click="router.push({ name: 'admin-events-create' })">
        Create
      </button>
    </div>
    <ul class="mt-6 space-y-3">
      <li
        v-for="ev in admin.events"
        :key="ev.id"
        class="card cursor-pointer"
        @click="router.push({ name: 'admin-event-detail', params: { id: ev.id } })"
      >
        <p class="font-semibold">{{ ev.name }}</p>
        <p class="text-sm text-slate-400">{{ ev.code }} · {{ ev.status }} · {{ ev.mode }}</p>
      </li>
    </ul>
  </div>
</template>
