<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();

async function logout() {
  await clear();
  await navigateTo("/login");
}
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <NuxtLink to="/" class="brand">Slova</NuxtLink>
      <div v-if="loggedIn" class="account">
        <span>{{ user?.email }}</span>
        <button type="button" @click="logout">Log out</button>
      </div>
    </header>
    <main>
      <slot />
    </main>
  </div>
</template>

<style scoped>
.shell {
  max-width: 640px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  font-family: system-ui, sans-serif;
}
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.brand {
  font-weight: 700;
  font-size: 1.25rem;
  text-decoration: none;
  color: inherit;
}
.account {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #4b5563;
}
</style>
