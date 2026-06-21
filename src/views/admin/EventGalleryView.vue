<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api, unwrap } from '@/api/client'
import { getErrorMessage } from '@/utils/errors'
import { selfieDisplayUrl } from '@/utils/selfieMedia'

const route = useRoute()
const eventId = computed(() => Number(route.params.id))

interface GallerySelfie {
  id: number
  image_url: string
  thumbnail_url: string
  status: string
  participant_id: number
}

const selfies = ref<GallerySelfie[]>([])
const loading = ref(true)
const error = ref('')
const brokenIds = ref<Set<number>>(new Set())

function mediaSrc(s: GallerySelfie) {
  return selfieDisplayUrl(s)
}

function onImgError(id: number) {
  brokenIds.value = new Set(brokenIds.value).add(id)
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    selfies.value = await unwrap(await api.get(`/admin/events/${eventId.value}/gallery`))
  } catch (e) {
    error.value = getErrorMessage(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold">Selfie gallery</h1>
    <p class="mt-1 text-sm text-slate-400">All selfies uploaded for this event.</p>

    <p v-if="loading" class="mt-6 text-slate-400">Loading gallery…</p>
    <p v-else-if="error" class="mt-6 text-sm text-red-400" role="alert">{{ error }}</p>

    <div v-else class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <article
        v-for="s in selfies"
        :key="s.id"
        class="card overflow-hidden p-0"
      >
        <a
          :href="mediaSrc(s)"
          target="_blank"
          rel="noopener noreferrer"
          class="relative block aspect-square bg-slate-800"
        >
          <img
            v-if="!brokenIds.has(s.id)"
            :src="mediaSrc(s)"
            :alt="`Selfie #${s.id}`"
            class="h-full w-full object-cover"
            loading="lazy"
            @error="onImgError(s.id)"
          />
          <div
            v-else
            class="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-xs text-slate-500"
          >
            <span>Image unavailable</span>
            <span class="text-brand-500">Open link</span>
          </div>
        </a>
        <p class="border-t border-slate-800 px-2 py-1.5 text-xs capitalize text-slate-400">
          {{ s.status }}
        </p>
      </article>
    </div>

    <p v-if="!loading && !error && !selfies.length" class="mt-4 text-slate-400">No selfies yet.</p>
  </div>
</template>
