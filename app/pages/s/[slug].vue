<script setup lang="ts">
// Public read-only view of a shared set. No auth required.
interface SharedSet {
  title: string;
  description: string | null;
  cards: { id: number; term: string; definition: string }[];
}

const route = useRoute();
const slug = route.params.slug as string;
const { loggedIn } = useUserSession();

const { data: set, error } = await useFetch<SharedSet>(`/api/public/sets/${slug}`);

useHead(() => ({ title: set.value ? `${set.value.title} — Slova` : "Shared set — Slova" }));

const copying = ref(false);
async function copySet() {
  copying.value = true;
  try {
    const result = await $fetch<{ id: number }>(`/api/public/sets/${slug}/copy`, {
      method: "POST",
    });
    await navigateTo(`/sets/${result.id}`);
  } finally {
    copying.value = false;
  }
}
</script>

<template>
  <div v-if="set">
    <p class="text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Shared set</p>
    <h1 class="mt-1 text-2xl font-bold">{{ set.title }}</h1>
    <p v-if="set.description" class="text-gray-500 dark:text-gray-400">{{ set.description }}</p>
    <p class="mt-1 text-sm text-gray-400 dark:text-gray-500">{{ set.cards.length }} words</p>

    <div class="my-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950">
      <template v-if="loggedIn">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Copy this set to your account to study it with spaced repetition.
        </p>
        <button type="button" class="btn btn-primary mt-2" :disabled="copying" @click="copySet">
          + Copy to my sets
        </button>
      </template>
      <template v-else>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Want to study these words with spaced repetition?
          <NuxtLink to="/register" class="text-blue-600 hover:underline dark:text-blue-400">Create a free account</NuxtLink>
          or
          <NuxtLink to="/login" class="text-blue-600 hover:underline dark:text-blue-400">log in</NuxtLink>
          to copy the set.
        </p>
      </template>
    </div>

    <ul class="flex flex-col gap-2">
      <li
        v-for="card in set.cards"
        :key="card.id"
        class="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800"
      >
        <SpeakButton :text="card.term" />
        <span class="font-semibold">{{ card.term }}</span>
        <span class="mx-4 flex-1 text-gray-600 dark:text-gray-300">{{ card.definition }}</span>
      </li>
    </ul>
  </div>

  <div v-else class="mt-12 text-center text-gray-500 dark:text-gray-400">
    <p>{{ error?.statusCode === 404 ? "This set isn't shared (anymore)." : "Failed to load this set." }}</p>
    <NuxtLink to="/" class="text-blue-600 hover:underline dark:text-blue-400">&larr; Slova</NuxtLink>
  </div>
</template>
