<script setup lang="ts">
import type { StudyCard, StudyMode } from "~/components/StudySession.vue";

definePageMeta({ middleware: "auth" });

interface QuizSet {
  id: number;
  title: string;
  description: string | null;
  now: string;
  cards: StudyCard[];
}

const route = useRoute();
const setId = route.params.id as string;

const { data: set, error, refresh } = await useFetch<QuizSet>(`/api/sets/${setId}`);

const term = ref("");
const definition = ref("");
const addingCard = ref(false);

async function addCard() {
  if (!term.value.trim() || !definition.value.trim()) return;
  addingCard.value = true;
  try {
    await $fetch(`/api/sets/${setId}/cards`, {
      method: "POST",
      body: { term: term.value, definition: definition.value },
    });
    term.value = "";
    definition.value = "";
    await refresh();
  } finally {
    addingCard.value = false;
  }
}

async function removeCard(id: number) {
  await $fetch(`/api/cards/${id}`, { method: "DELETE" });
  await refresh();
}

const mode = ref<"edit" | "study">("edit");

// --- Study setup ---
const studyMode = ref<StudyMode>("flashcards");
const direction = ref<"term-first" | "definition-first">("term-first");
const queueType = ref<"due" | "all">("due");
const sessionCards = ref<StudyCard[] | null>(null);

// Multiple choice needs at least one wrong option to pick from, and matching
// needs at least two pairs on the board.
const pairModesAvailable = computed(() => (set.value?.cards.length ?? 0) >= 2);

const progressStats = computed(() => {
  const cards = set.value?.cards ?? [];
  const learned = cards.filter((card) => card.progress?.status === "learned").length;
  const learning = cards.filter(
    (card) => card.progress && card.progress.status !== "learned",
  ).length;
  return { total: cards.length, learned, learning, fresh: cards.length - learned - learning };
});

// Cards failed most often — worth extra attention.
const trickyCards = computed(() =>
  (set.value?.cards ?? [])
    .filter((card) => (card.progress?.lapses ?? 0) > 0)
    .sort((a, b) => b.progress!.lapses - a.progress!.lapses)
    .slice(0, 5),
);

// The server sends its clock with the set so due checks don't depend on the
// client's timezone; timestamps are UTC strings and compare lexicographically.
const dueCards = computed(
  () =>
    set.value?.cards.filter(
      (card) => !card.progress || card.progress.dueAt <= set.value!.now,
    ) ?? [],
);

function startSession() {
  const pool = queueType.value === "due" ? dueCards.value : (set.value?.cards ?? []);
  if (!pool.length) return;
  // Shuffled, but cards failed most often surface first.
  sessionCards.value = shuffle(pool).sort(
    (a, b) => (b.progress?.lapses ?? 0) - (a.progress?.lapses ?? 0),
  );
}

async function endSession() {
  sessionCards.value = null;
  await refresh();
}

function openStudy() {
  sessionCards.value = null;
  mode.value = "study";
}
</script>

<template>
  <div v-if="set">
    <NuxtLink to="/" class="text-sm text-blue-600 hover:underline dark:text-blue-400">&larr; My sets</NuxtLink>
    <h1 class="mt-1 text-2xl font-bold">{{ set.title }}</h1>
    <p v-if="set.description" class="text-gray-500 dark:text-gray-400">{{ set.description }}</p>

    <div v-if="progressStats.total" class="my-3">
      <div class="flex h-2 overflow-hidden rounded bg-gray-200 dark:bg-gray-800">
        <div
          class="bg-green-500"
          :style="{ width: `${(progressStats.learned / progressStats.total) * 100}%` }"
        />
        <div
          class="bg-amber-500"
          :style="{ width: `${(progressStats.learning / progressStats.total) * 100}%` }"
        />
      </div>
      <div class="mt-1.5 flex gap-4 text-xs">
        <span class="text-green-600 dark:text-green-400">● {{ progressStats.learned }} learned</span>
        <span class="text-amber-600 dark:text-amber-400">● {{ progressStats.learning }} learning</span>
        <span class="text-gray-400 dark:text-gray-500">● {{ progressStats.fresh }} new</span>
      </div>
    </div>

    <div class="my-4 flex gap-2">
      <button
        type="button"
        class="btn"
        :class="{ 'btn-active': mode === 'edit' }"
        @click="mode = 'edit'"
      >
        Edit
      </button>
      <button
        type="button"
        class="btn"
        :class="{ 'btn-active': mode === 'study' }"
        :disabled="!set.cards.length"
        @click="openStudy"
      >
        Study
      </button>
      <a
        v-if="mode === 'edit' && set.cards.length"
        class="btn ml-auto"
        :href="`/api/sets/${setId}/export`"
        download
      >
        ⬇ Export CSV
      </a>
    </div>

    <template v-if="mode === 'edit'">
      <form class="mb-6 flex gap-2" @submit.prevent="addCard">
        <input v-model="term" class="input flex-1" placeholder="Term" required />
        <input v-model="definition" class="input flex-1" placeholder="Definition" required />
        <button type="submit" class="btn btn-primary" :disabled="addingCard">Add card</button>
      </form>

      <ImportCards :set-id="setId" @imported="refresh" />

      <ul class="flex flex-col gap-2">
        <li
          v-for="card in set.cards"
          :key="card.id"
          class="flex items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2 dark:border-gray-800"
        >
          <SpeakButton :text="card.term" />
          <span class="font-semibold">{{ card.term }}</span>
          <span class="mx-4 flex-1 text-gray-600 dark:text-gray-300">{{ card.definition }}</span>
          <button type="button" class="btn px-2 py-1 text-xs" @click="removeCard(card.id)">Delete</button>
        </li>
        <li v-if="!set.cards.length" class="py-2 text-center text-gray-400 dark:text-gray-500">
          No cards yet — add one above.
        </li>
      </ul>
    </template>

    <template v-else>
      <StudySession
        v-if="sessionCards"
        :cards="sessionCards"
        :all-cards="set.cards"
        :mode="studyMode"
        :direction="direction"
        @done="endSession"
      />

      <div v-else class="flex flex-col gap-4">
        <div>
          <span class="mb-1.5 block text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Mode</span>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': studyMode === 'flashcards' }"
              @click="studyMode = 'flashcards'"
            >
              🃏 Flashcards
            </button>
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': studyMode === 'choice' }"
              :disabled="!pairModesAvailable"
              @click="studyMode = 'choice'"
            >
              ✅ Multiple choice
            </button>
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': studyMode === 'typing' }"
              @click="studyMode = 'typing'"
            >
              ⌨️ Typing
            </button>
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': studyMode === 'match' }"
              :disabled="!pairModesAvailable"
              @click="studyMode = 'match'"
            >
              🧩 Match
            </button>
          </div>
        </div>

        <div>
          <span class="mb-1.5 block text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Cards</span>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': queueType === 'due' }"
              @click="queueType = 'due'"
            >
              Due for review ({{ dueCards.length }})
            </button>
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': queueType === 'all' }"
              @click="queueType = 'all'"
            >
              All cards ({{ set.cards.length }})
            </button>
          </div>
        </div>

        <!-- Match shows both sides at once, so direction doesn't apply. -->
        <div v-if="studyMode !== 'match'">
          <span class="mb-1.5 block text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Direction</span>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': direction === 'term-first' }"
              @click="direction = 'term-first'"
            >
              Term &rarr; Definition
            </button>
            <button
              type="button"
              class="btn"
              :class="{ 'btn-active': direction === 'definition-first' }"
              @click="direction = 'definition-first'"
            >
              Definition &rarr; Term
            </button>
          </div>
        </div>

        <div v-if="trickyCards.length">
          <span class="mb-1.5 block text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">Tricky words</span>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="card in trickyCards"
              :key="card.id"
              class="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm dark:border-amber-900 dark:bg-amber-950"
            >
              <span class="font-semibold">{{ card.term }}</span>
              <span class="flex-1 text-gray-500 dark:text-gray-400">{{ card.definition }}</span>
              <span class="whitespace-nowrap text-amber-600 dark:text-amber-400">missed ×{{ card.progress!.lapses }}</span>
            </li>
          </ul>
        </div>

        <p
          v-if="queueType === 'due' && !dueCards.length"
          class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
        >
          🎉 Nothing to review right now — everything is scheduled for later. Come back
          tomorrow, or practice all cards.
        </p>

        <button
          type="button"
          class="btn btn-primary py-2.5 text-base"
          :disabled="queueType === 'due' ? !dueCards.length : !set.cards.length"
          @click="startSession"
        >
          Start studying
        </button>
      </div>
    </template>
  </div>
  <div v-else class="mt-12 text-center text-gray-500 dark:text-gray-400">
    <p>{{ error?.statusCode === 404 ? "Set not found." : "Failed to load this set." }}</p>
    <NuxtLink to="/" class="text-blue-600 hover:underline dark:text-blue-400">&larr; My sets</NuxtLink>
  </div>
</template>
