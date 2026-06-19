<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import AdminBackNav from '@/components/admin/AdminBackNav.vue'
import TickTalkLogo from '@/components/TickTalkLogo.vue'
import { useAdminAuthStore } from '@/stores/adminAuth'

const route = useRoute()
const router = useRouter()
const adminAuth = useAdminAuthStore()

const isAuthPage = computed(() =>
  route.name === 'admin-login' || route.name === 'admin-logout'
)

async function logout() {
  await router.push({ name: 'admin-logout' })
}
</script>

<template>
  <div class="game-theme game-theme--decor min-h-dvh">
    <header
      v-if="!isAuthPage && adminAuth.isAuthenticated"
      class="game-admin-header sticky top-0 z-40 px-4 py-3 backdrop-blur"
    >
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <router-link to="/admin/dashboard" class="flex items-center gap-4">
          <div class="flex h-10 items-center justify-center rounded bg-white/95 px-2 shadow-sm">
            <img src="/select-logo.png" alt="Select" class="h-8 brightness-0" />
          </div>
          <TickTalkLogo class="text-[0.65em]" />
        </router-link>
        <div class="flex items-center gap-3">
          <div v-if="adminAuth.admin" class="hidden text-right sm:block">
            <p class="text-sm font-medium text-slate-200">{{ adminAuth.admin.name }}</p>
            <p class="text-xs font-bold text-brand-500">{{ adminAuth.roleLabel }}</p>
          </div>
          <button type="button" class="btn-primary text-sm" @click="logout">
            Sign out
          </button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-5xl px-4 py-6">
      <AdminBackNav v-if="!isAuthPage && adminAuth.isAuthenticated" />
      <RouterView v-slot="{ Component }">
        <Transition name="tt-page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>
