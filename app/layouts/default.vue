<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();
const { isDark, sync, toggle } = useTheme();

onMounted(sync);

async function logout() {
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-6">
    <header class="mb-8 flex items-center justify-between">
      <NuxtLink to="/" class="text-xl font-bold text-gray-900 dark:text-gray-100">Slova</NuxtLink>
      <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <span v-if="loggedIn">{{ user?.email }}</span>
        <button
          type="button"
          class="btn px-2"
          :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="toggle"
        >
          {{ isDark ? "☀️" : "🌙" }}
        </button>
        <button v-if="loggedIn" type="button" class="btn" @click="logout">Log out</button>
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
