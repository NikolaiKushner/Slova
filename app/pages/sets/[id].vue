<script setup lang="ts">
import type { StudyCard } from "~/components/StudySession.vue";

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
const direction = ref<"term-first" | "definition-first">("term-first");
const queueType = ref<"due" | "all">("due");
const sessionCards = ref<StudyCard[] | null>(null);

// The server sends its clock with the set so due checks don't depend on the
// client's timezone; timestamps are UTC strings and compare lexicographically.
const dueCards = computed(
  () =>
    set.value?.cards.filter(
      (card) => !card.progress || card.progress.dueAt <= set.value!.now,
    ) ?? [],
);

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

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
    <NuxtLink to="/">&larr; My sets</NuxtLink>
    <h1>{{ set.title }}</h1>
    <p v-if="set.description" class="description">{{ set.description }}</p>

    <div class="mode-switch">
      <button type="button" :class="{ active: mode === 'edit' }" @click="mode = 'edit'">Edit</button>
      <button
        type="button"
        :class="{ active: mode === 'study' }"
        :disabled="!set.cards.length"
        @click="openStudy"
      >
        Study
      </button>
    </div>

    <template v-if="mode === 'edit'">
      <form class="new-card" @submit.prevent="addCard">
        <input v-model="term" placeholder="Term" required />
        <input v-model="definition" placeholder="Definition" required />
        <button type="submit" :disabled="addingCard">Add card</button>
      </form>

      <ul class="cards">
        <li v-for="card in set.cards" :key="card.id">
          <span class="term">{{ card.term }}</span>
          <span class="definition">{{ card.definition }}</span>
          <button type="button" @click="removeCard(card.id)">Delete</button>
        </li>
        <li v-if="!set.cards.length" class="empty">No cards yet — add one above.</li>
      </ul>
    </template>

    <template v-else>
      <StudySession
        v-if="sessionCards"
        :cards="sessionCards"
        :direction="direction"
        @done="endSession"
      />

      <div v-else class="study-setup">
        <div class="option-group">
          <span class="label">Cards</span>
          <div class="options">
            <button
              type="button"
              :class="{ active: queueType === 'due' }"
              @click="queueType = 'due'"
            >
              Due for review ({{ dueCards.length }})
            </button>
            <button
              type="button"
              :class="{ active: queueType === 'all' }"
              @click="queueType = 'all'"
            >
              All cards ({{ set.cards.length }})
            </button>
          </div>
        </div>

        <div class="option-group">
          <span class="label">Direction</span>
          <div class="options">
            <button
              type="button"
              :class="{ active: direction === 'term-first' }"
              @click="direction = 'term-first'"
            >
              Term &rarr; Definition
            </button>
            <button
              type="button"
              :class="{ active: direction === 'definition-first' }"
              @click="direction = 'definition-first'"
            >
              Definition &rarr; Term
            </button>
          </div>
        </div>

        <p v-if="queueType === 'due' && !dueCards.length" class="all-done">
          🎉 Nothing to review right now — everything is scheduled for later. Come back
          tomorrow, or practice all cards.
        </p>

        <button
          type="button"
          class="start"
          :disabled="queueType === 'due' ? !dueCards.length : !set.cards.length"
          @click="startSession"
        >
          Start studying
        </button>
      </div>
    </template>
  </div>
  <div v-else class="not-found">
    <p>{{ error?.statusCode === 404 ? "Set not found." : "Failed to load this set." }}</p>
    <NuxtLink to="/">&larr; My sets</NuxtLink>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  color: #6b7280;
  margin-top: 3rem;
}
.description {
  color: #6b7280;
}
.mode-switch {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}
.mode-switch button.active {
  font-weight: 700;
}
.new-card {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.new-card input {
  flex: 1;
  padding: 0.4rem 0.6rem;
}
.cards {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cards li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.term {
  font-weight: 600;
}
.definition {
  color: #4b5563;
  flex: 1;
  margin: 0 1rem;
}
.empty {
  color: #9ca3af;
  border: none;
  justify-content: center;
}
.study-setup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.option-group .label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 0.35rem;
}
.options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.options button {
  padding: 0.45rem 0.9rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.options button.active {
  border-color: #3b82f6;
  background: #eff6ff;
  font-weight: 600;
}
.all-done {
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.start {
  padding: 0.6rem;
  font-size: 1rem;
}
</style>
