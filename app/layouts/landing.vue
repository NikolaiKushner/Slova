<script setup lang="ts">
// Landing chrome: sticky header with anchor nav + always-visible CTA, and a
// quiet footer. The app itself uses the default layout.
const { loggedIn } = useUserSession();
const { isDark, sync, toggle } = useTheme();

onMounted(sync);

const nav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header
      class="sticky top-0 z-40 border-b border-gray-200/70 bg-white/85 backdrop-blur dark:border-gray-800/70 dark:bg-gray-950/85"
    >
      <div class="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <NuxtLink to="/" class="text-xl font-bold text-gray-900 dark:text-gray-100">Slova</NuxtLink>
        <nav class="hidden items-center gap-5 text-sm text-gray-600 sm:flex dark:text-gray-300">
          <a
            v-for="item in nav"
            :key="item.href"
            :href="item.href"
            class="hover:text-gray-900 dark:hover:text-gray-100"
          >
            {{ item.label }}
          </a>
        </nav>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn px-2"
            :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
            @click="toggle"
          >
            {{ isDark ? "☀️" : "🌙" }}
          </button>
          <template v-if="loggedIn">
            <NuxtLink to="/dashboard" class="btn btn-primary">Dashboard</NuxtLink>
          </template>
          <template v-else>
            <NuxtLink to="/login" class="btn hidden sm:inline-flex">Log in</NuxtLink>
            <NuxtLink to="/register" class="btn btn-primary">Get started</NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-4xl flex-1 px-4">
      <slot />
    </main>

    <footer class="border-t border-gray-200 py-6 dark:border-gray-800">
      <div
        class="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-gray-500 dark:text-gray-400"
      >
        <span>© {{ new Date().getFullYear() }} Slova</span>
        <div class="flex items-center gap-4">
          <a
            href="https://github.com/NikolaiKushner/Slova"
            target="_blank"
            rel="noopener"
            class="hover:text-gray-900 dark:hover:text-gray-100"
          >
            GitHub
          </a>
          <NuxtLink to="/login" class="hover:text-gray-900 dark:hover:text-gray-100">Log in</NuxtLink>
          <NuxtLink to="/register" class="hover:text-gray-900 dark:hover:text-gray-100">Sign up</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
