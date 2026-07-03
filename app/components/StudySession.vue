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

const props = defineProps<{
  cards: StudyCard[];
  direction: "term-first" | "definition-first";
}>();

const emit = defineEmits<{ done: [] }>();

const queue = ref<StudyCard[]>([...props.cards]);
const index = ref(0);
const flipped = ref(false);
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

async function rate(rating: Rating) {
  const card = current.value;
  if (!card || saving.value) return;
  saving.value = true;
  try {
    await $fetch(`/api/cards/${card.id}/review`, {
      method: "POST",
      body: { rating, mode: "flashcards" },
    });
    if (!firstAnswers.has(card.id)) {
      firstAnswers.set(card.id, rating);
      summary[rating] += 1;
    }
    // Failed cards come back at the end of the session until answered.
    if (rating === "again") queue.value.push(card);
    flipped.value = false;
    index.value += 1;
  } finally {
    saving.value = false;
  }
}

function onKeydown(e: KeyboardEvent) {
  if (finished.value) return;
  if (e.code === "Space") {
    e.preventDefault();
    flipped.value = !flipped.value;
  } else if (flipped.value && ["1", "2", "3"].includes(e.key)) {
    e.preventDefault();
    rate((["again", "hard", "good"] as const)[Number(e.key) - 1]!);
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div>
    <template v-if="!finished && current">
      <div class="session-progress">
        <span>{{ index + 1 }} / {{ queue.length }}</span>
        <div class="bar"><div class="fill" :style="{ width: `${(index / queue.length) * 100}%` }" /></div>
      </div>

      <div class="flashcard" @click="flipped = !flipped">
        <p>{{ flipped ? back(current) : front(current) }}</p>
        <span class="hint">{{ flipped ? "How well did you know it?" : "Click or press Space to flip" }}</span>
      </div>

      <div v-if="flipped" class="ratings">
        <button type="button" class="again" :disabled="saving" @click="rate('again')">
          Again <kbd>1</kbd>
        </button>
        <button type="button" class="hard" :disabled="saving" @click="rate('hard')">
          Hard <kbd>2</kbd>
        </button>
        <button type="button" class="good" :disabled="saving" @click="rate('good')">
          Good <kbd>3</kbd>
        </button>
      </div>
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
.flashcard {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 4rem 1rem;
  text-align: center;
  font-size: 1.5rem;
  cursor: pointer;
  user-select: none;
}
.flashcard .hint {
  display: block;
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}
.ratings {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.ratings button {
  flex: 1;
  padding: 0.6rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 1rem;
}
.ratings kbd {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-left: 0.25rem;
}
.ratings .again {
  background: #fef2f2;
  border-color: #fecaca;
}
.ratings .hard {
  background: #fffbeb;
  border-color: #fde68a;
}
.ratings .good {
  background: #f0fdf4;
  border-color: #bbf7d0;
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
