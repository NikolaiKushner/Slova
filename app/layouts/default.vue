<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();

async function logout() {
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-6">
    <header class="mb-8 flex items-center justify-between">
      <NuxtLink to="/" class="text-xl font-bold text-gray-900">Slova</NuxtLink>
      <div v-if="loggedIn" class="flex items-center gap-3 text-sm text-gray-600">
        <span>{{ user?.email }}</span>
        <button type="button" class="btn" @click="logout">Log out</button>
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>
