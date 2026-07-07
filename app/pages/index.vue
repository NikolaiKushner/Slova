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
  days: { day: string; reviews: number }[];
}

interface StarterPack {
  slug: string;
  title: string;
  description: string;
  level: "A1" | "A2" | "B1";
  cardCount: number;
  added: boolean;
  recommended: boolean;
}

const LEVELS = [
  { code: "A1", label: "Beginner" },
  { code: "A2", label: "Elementary" },
  { code: "B1", label: "Intermediate" },
] as const;

const { data: sets, refresh } = await useFetch<QuizSet[]>("/api/sets");
const { data: stats } = await useFetch<Stats>("/api/stats");
const { data: packData, refresh: refreshPacks } = await useFetch<{
  level: StarterPack["level"] | null;
  packs: StarterPack[];
}>("/api/starter-packs");

const suggestedPacks = computed(() => (packData.value?.packs ?? []).filter((pack) => !pack.added));
const userLevel = computed(() => packData.value?.level ?? null);

// The user's own level (picked at registration) goes first, marked as
// recommended; the sort is stable so the rest keep the A1→B1 order.
const packsByLevel = computed(() =>
  LEVELS.map((level) => ({
    ...level,
    recommended: level.code === userLevel.value,
    packs: suggestedPacks.value.filter((pack) => pack.level === level.code),
  }))
    .filter((group) => group.packs.length)
    .sort((a, b) => Number(b.recommended) - Number(a.recommended)),
);

const hasChart = computed(() => (stats.value?.days ?? []).some((d) => d.reviews > 0));
const addingPack = ref<string | null>(null);

async function addPack(slug: string) {
  addingPack.value = slug;
  try {
    await $fetch(`/api/starter-packs/${slug}`, { method: "POST" });
    await Promise.all([refresh(), refreshPacks()]);
  } finally {
    addingPack.value = null;
  }
}

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
      v-if="stats && (stats.streak || stats.reviewsToday || stats.dueTotal || hasChart)"
      class="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
    >
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <span v-if="stats.streak" class="font-semibold">🔥 {{ stats.streak }}-day streak</span>
        <span>{{ stats.reviewsToday }} reviews today</span>
        <span v-if="stats.dueTotal" class="text-blue-700 dark:text-blue-400">{{ stats.dueTotal }} cards due</span>
        <span v-else class="text-green-600 dark:text-green-400">all caught up ✓</span>
      </div>
      <div v-if="hasChart" class="mt-3 border-t border-gray-200 pt-3 dark:border-gray-800">
        <h2 class="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Reviews · last 14 days
        </h2>
        <StatsChart :days="stats.days" />
      </div>
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
        class="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800"
      >
        <NuxtLink :to="`/sets/${set.id}`" class="text-blue-600 hover:underline dark:text-blue-400">
          {{ set.title }}
        </NuxtLink>
        <span v-if="set.description" class="flex-1 text-sm text-gray-500 dark:text-gray-400">
          {{ set.description }}
        </span>
        <span v-if="set.cardCount" class="text-xs whitespace-nowrap text-gray-400 dark:text-gray-500">
          {{ set.learnedCount }}/{{ set.cardCount }} learned
        </span>
        <span
          v-if="set.dueCount"
          class="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs whitespace-nowrap text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
        >
          {{ set.dueCount }} due
        </span>
        <span
          v-else-if="set.cardCount"
          class="text-xs whitespace-nowrap text-green-600 dark:text-green-400"
        >
          ✓ done for now
        </span>
        <button type="button" class="btn px-2 py-1 text-xs" @click="removeSet(set.id)">Delete</button>
      </li>
      <li v-if="!sets?.length" class="py-2 text-center text-gray-400 dark:text-gray-500">
        No sets yet — create one above, or grab a starter pack below.
      </li>
    </ul>

    <div v-if="suggestedPacks.length" class="mt-8">
      <h2 class="mb-1 text-lg font-bold">Starter packs</h2>
      <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">
        {{
          userLevel
            ? `Curated English vocabulary — packs for your level (${userLevel}) come first.`
            : "Curated English vocabulary to get you going — add a pack and start studying right away."
        }}
      </p>
      <div v-for="group in packsByLevel" :key="group.code" class="mb-4">
        <h3 class="mb-2 flex items-center gap-2 text-sm font-semibold">
          <span
            class="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
          >
            {{ group.code }}
          </span>
          {{ group.label }}
          <span
            v-if="group.recommended"
            class="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white"
          >
            your level
          </span>
        </h3>
        <ul class="flex flex-col gap-2">
          <li
            v-for="pack in group.packs"
            :key="pack.slug"
            class="flex items-center justify-between gap-3 rounded-md border border-dashed border-gray-300 px-3 py-2 dark:border-gray-700"
          >
            <div class="min-w-0">
              <span class="font-medium">{{ pack.title }}</span>
              <span class="ml-2 text-xs whitespace-nowrap text-gray-400 dark:text-gray-500">
                {{ pack.cardCount }} words
              </span>
              <p class="truncate text-sm text-gray-500 dark:text-gray-400">{{ pack.description }}</p>
            </div>
            <button
              type="button"
              class="btn shrink-0"
              :disabled="addingPack === pack.slug"
              @click="addPack(pack.slug)"
            >
              + Add
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
