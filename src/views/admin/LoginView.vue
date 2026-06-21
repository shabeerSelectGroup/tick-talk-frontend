<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminAuthStore } from '@/stores/adminAuth'
import TickTalkLogo from '@/components/TickTalkLogo.vue'

const adminAuth = useAdminAuthStore()
const router = useRouter()
const route = useRoute()

const securityCode = ref('')
const error = ref('')
const loading = ref(false)

const redirectTo = computed(
  () => (route.query.redirect as string) || '/admin/dashboard'
)

async function submit() {
  const code = securityCode.value.trim()
  if (!code) {
    error.value = 'Enter the admin security code'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await adminAuth.loginWithSecurityCode(code)
    router.replace(redirectTo.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Invalid security code'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4">
    <div class="card space-y-6">
      <div class="text-center">
        <TickTalkLogo class="mb-4 text-[1.1em]" />
        <p class="game-stat-label mt-2">Create events and teams.</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="security-code" class="game-label mb-1 block">
            Security code
          </label>
          <input
            id="security-code"
            v-model="securityCode"
            type="password"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            class="input font-mono tracking-wide"
            placeholder="ENTER ADMIN CODE..."
            required
          />
        </div>

        <p v-if="error" class="game-error px-3 py-2 text-sm" role="alert">
          {{ error }}
        </p>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          {{ loading ? 'Checking…' : 'Enter Admin →' }}
        </button>
      </form>

      <p class="game-stat-label text-center text-xs">
        Code is set in <code class="font-mono">backend/.env</code>
      </p>
    </div>
  </div>
</template>
