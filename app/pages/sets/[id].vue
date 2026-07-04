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

// Multiple choice needs at least one wrong option to pick from.
const choiceAvailable = computed(() => (set.value?.cards.length ?? 0) >= 2);

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
    <NuxtLink to="/">&larr; My sets</NuxtLink>
    <h1>{{ set.title }}</h1>
    <p v-if="set.description" class="description">{{ set.description }}</p>

    <div v-if="progressStats.total" class="set-progress">
      <div class="bar">
        <div
          class="segment learned"
          :style="{ width: `${(progressStats.learned / progressStats.total) * 100}%` }"
        />
        <div
          class="segment learning"
          :style="{ width: `${(progressStats.learning / progressStats.total) * 100}%` }"
        />
      </div>
      <div class="legend">
        <span class="learned">● {{ progressStats.learned }} learned</span>
        <span class="learning">● {{ progressStats.learning }} learning</span>
        <span class="fresh">● {{ progressStats.fresh }} new</span>
      </div>
    </div>

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
        :all-cards="set.cards"
        :mode="studyMode"
        :direction="direction"
        @done="endSession"
      />

      <div v-else class="study-setup">
        <div class="option-group">
          <span class="label">Mode</span>
          <div class="options">
            <button
              type="button"
              :class="{ active: studyMode === 'flashcards' }"
              @click="studyMode = 'flashcards'"
            >
              🃏 Flashcards
            </button>
            <button
              type="button"
              :class="{ active: studyMode === 'choice' }"
              :disabled="!choiceAvailable"
              @click="studyMode = 'choice'"
            >
              ✅ Multiple choice
            </button>
            <button
              type="button"
              :class="{ active: studyMode === 'typing' }"
              @click="studyMode = 'typing'"
            >
              ⌨️ Typing
            </button>
          </div>
        </div>

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

        <div v-if="trickyCards.length" class="tricky">
          <span class="label">Tricky words</span>
          <ul>
            <li v-for="card in trickyCards" :key="card.id">
              <span class="term">{{ card.term }}</span>
              <span class="definition">{{ card.definition }}</span>
              <span class="misses">missed ×{{ card.progress!.lapses }}</span>
            </li>
          </ul>
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
.set-progress {
  margin: 0.75rem 0;
}
.set-progress .bar {
  display: flex;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}
.set-progress .segment.learned {
  background: #22c55e;
}
.set-progress .segment.learning {
  background: #f59e0b;
}
.set-progress .legend {
  display: flex;
  gap: 1rem;
  margin-top: 0.35rem;
  font-size: 0.75rem;
}
.set-progress .legend .learned {
  color: #16a34a;
}
.set-progress .legend .learning {
  color: #d97706;
}
.set-progress .legend .fresh {
  color: #9ca3af;
}
.tricky .label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
  margin-bottom: 0.35rem;
}
.tricky ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.tricky li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.75rem;
  border: 1px solid #fde68a;
  background: #fffbeb;
  border-radius: 6px;
  font-size: 0.875rem;
}
.tricky .definition {
  color: #6b7280;
  flex: 1;
}
.tricky .misses {
  color: #d97706;
  white-space: nowrap;
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
.options button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
