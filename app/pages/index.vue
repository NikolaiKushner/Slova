<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface QuizSet {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  cardCount: number;
  learnedCount: number;
  dueCount: number;
}

interface Stats {
  streak: number;
  reviewsToday: number;
  dueTotal: number;
}

const { data: sets, refresh } = await useFetch<QuizSet[]>("/api/sets");
const { data: stats } = await useFetch<Stats>("/api/stats");

const title = ref("");
const description = ref("");
const creating = ref(false);

async function createSet() {
  if (!title.value.trim()) return;
  creating.value = true;
  try {
    await $fetch("/api/sets", {
      method: "POST",
      body: { title: title.value, description: description.value },
    });
    title.value = "";
    description.value = "";
    await refresh();
  } finally {
    creating.value = false;
  }
}

async function removeSet(id: number) {
  await $fetch(`/api/sets/${id}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <div>
    <h1 class="mb-4 text-2xl font-bold">My sets</h1>

    <div
      v-if="stats && (stats.streak || stats.reviewsToday || stats.dueTotal)"
      class="mb-4 flex flex-wrap gap-x-5 gap-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600"
    >
      <span v-if="stats.streak" class="font-semibold">🔥 {{ stats.streak }}-day streak</span>
      <span>{{ stats.reviewsToday }} reviews today</span>
      <span v-if="stats.dueTotal" class="text-blue-700">{{ stats.dueTotal }} cards due</span>
      <span v-else class="text-green-600">all caught up ✓</span>
    </div>

    <form class="mb-6 flex gap-2" @submit.prevent="createSet">
      <input v-model="title" class="input flex-1" placeholder="Set title" required />
      <input v-model="description" class="input flex-1" placeholder="Description (optional)" />
      <button type="submit" class="btn btn-primary" :disabled="creating">Create</button>
    </form>

    <ul class="flex flex-col gap-2">
      <li
        v-for="set in sets"
        :key="set.id"
        class="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2"
      >
        <NuxtLink :to="`/sets/${set.id}`" class="text-blue-600 hover:underline">{{ set.title }}</NuxtLink>
        <span v-if="set.description" class="flex-1 text-sm text-gray-500">{{ set.description }}</span>
        <span v-if="set.cardCount" class="text-xs whitespace-nowrap text-gray-400">
          {{ set.learnedCount }}/{{ set.cardCount }} learned
        </span>
        <span
          v-if="set.dueCount"
          class="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs whitespace-nowrap text-blue-700"
        >
          {{ set.dueCount }} due
        </span>
        <span v-else-if="set.cardCount" class="text-xs whitespace-nowrap text-green-600">✓ done for now</span>
        <button type="button" class="btn px-2 py-1 text-xs" @click="removeSet(set.id)">Delete</button>
      </li>
      <li v-if="!sets?.length" class="py-2 text-center text-gray-400">No sets yet — create one above.</li>
    </ul>
  </div>
</template>
