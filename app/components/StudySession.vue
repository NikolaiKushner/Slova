<script setup lang="ts">
export interface CardProgress {
  status: string;
  ease: number;
  intervalDays: number;
  dueAt: string;
  correctStreak: number;
  lapses: number;
}

export interface StudyCard {
  id: number;
  term: string;
  definition: string;
  progress: CardProgress | null;
}

export type Rating = "again" | "hard" | "good";
export type StudyMode = "flashcards" | "choice" | "typing";

const props = defineProps<{
  cards: StudyCard[];
  // Full set, used to draw wrong options for multiple choice.
  allCards: StudyCard[];
  mode: StudyMode;
  direction: "term-first" | "definition-first";
}>();

const emit = defineEmits<{ done: [] }>();

const queue = ref<StudyCard[]>([...props.cards]);
const index = ref(0);
const saving = ref(false);

// Summary counts the first answer per card; in-session repeats don't recount.
const firstAnswers = new Map<number, Rating>();
const summary = reactive({ good: 0, hard: 0, again: 0 });

const current = computed(() => queue.value[index.value]);
const finished = computed(() => index.value >= queue.value.length);

function front(card: StudyCard) {
  return props.direction === "term-first" ? card.term : card.definition;
}
function back(card: StudyCard) {
  return props.direction === "term-first" ? card.definition : card.term;
}

const choiceOptions = computed(() => {
  const card = current.value;
  if (!card || props.mode !== "choice") return [];
  const answer = back(card);
  const distractors = shuffle(
    [...new Set(props.allCards.map(back))].filter((text) => text !== answer),
  ).slice(0, 3);
  return shuffle([answer, ...distractors]);
});

async function submit(rating: Rating) {
  const card = current.value;
  if (!card || saving.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/cards/${card.id}/review`, {
      method: "POST",
      body: { rating, mode: props.mode },
    });
    if (!firstAnswers.has(card.id)) {
      firstAnswers.set(card.id, rating);
      summary[rating] += 1;
    }
    // Failed cards come back at the end of the session until answered.
    if (rating === "again") queue.value.push(card);
  } finally {
    saving.value = false;
  }
}

function advance() {
  index.value += 1;
}

async function rateAndAdvance(rating: Rating) {
  await submit(rating);
  advance();
}
</script>

<template>
  <div>
    <template v-if="!finished && current">
      <div class="session-progress">
        <span>{{ index + 1 }} / {{ queue.length }}</span>
        <div class="bar"><div class="fill" :style="{ width: `${(index / queue.length) * 100}%` }" /></div>
      </div>

      <StudyFlashcard
        v-if="mode === 'flashcards'"
        :key="`${current.id}-${index}`"
        :front="front(current)"
        :back="back(current)"
        :saving="saving"
        @rate="rateAndAdvance"
      />
      <StudyChoice
        v-else-if="mode === 'choice'"
        :key="`${current.id}-${index}`"
        :front="front(current)"
        :answer="back(current)"
        :options="choiceOptions"
        @answered="submit"
        @next="advance"
      />
      <StudyTyping
        v-else
        :key="`${current.id}-${index}`"
        :front="front(current)"
        :answer="back(current)"
        @answered="submit"
        @next="advance"
      />
    </template>

    <div v-else class="summary">
      <h2>Session complete</h2>
      <ul>
        <li class="good">Knew it: {{ summary.good }}</li>
        <li class="hard">Hard: {{ summary.hard }}</li>
        <li class="again">Didn't know: {{ summary.again }}</li>
      </ul>
      <p class="note">Cards you missed will come back sooner; cards you knew will wait longer.</p>
      <button type="button" @click="emit('done')">Done</button>
    </div>
  </div>
</template>

<style scoped>
.session-progress {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #6b7280;
}
.session-progress .bar {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}
.session-progress .fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.2s;
}
.summary {
  text-align: center;
  padding: 2rem 0;
}
.summary ul {
  list-style: none;
  padding: 0;
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 1rem 0;
}
.summary .good {
  color: #16a34a;
}
.summary .hard {
  color: #d97706;
}
.summary .again {
  color: #dc2626;
}
.summary .note {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}
.summary button {
  padding: 0.5rem 2rem;
}
</style>
