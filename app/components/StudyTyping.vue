<script setup lang="ts">
import type { Rating } from "~/components/StudySession.vue";

const props = defineProps<{ front: string; answer: string }>();
const emit = defineEmits<{ answered: [rating: Rating]; next: [] }>();

const input = ref("");
const inputEl = ref<HTMLInputElement | null>(null);
const result = ref<"exact" | "typo" | "wrong" | null>(null);

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = Math.min(
        prev[j]! + 1,
        prev[j - 1]! + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = prev[j]!;
      prev[j] = next;
    }
  }
  return prev[b.length]!;
}

function submit() {
  if (result.value) {
    emit("next");
    return;
  }
  const guess = normalize(input.value);
  if (!guess) return;
  const target = normalize(props.answer);

  if (guess === target) {
    result.value = "exact";
    emit("answered", "good");
  } else if (target.length >= 5 && levenshtein(guess, target) === 1) {
    // One letter off on a longer word counts, but schedules a sooner review.
    result.value = "typo";
    emit("answered", "hard");
  } else {
    result.value = "wrong";
    emit("answered", "again");
  }
}

function giveUp() {
  if (result.value) return;
  result.value = "wrong";
  emit("answered", "again");
}

onMounted(() => inputEl.value?.focus());
</script>

<template>
  <div>
    <div class="prompt">
      <p>{{ front }}</p>
      <span class="hint">Type the answer</span>
    </div>

    <form class="answer-form" @submit.prevent="submit">
      <input
        ref="inputEl"
        v-model="input"
        :readonly="result !== null"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Your answer…"
      />
      <button v-if="!result" type="submit">Check</button>
      <button v-else type="submit">Next <kbd>Enter</kbd></button>
    </form>
    <button v-if="!result" type="button" class="give-up" @click="giveUp">I don't know</button>

    <p v-if="result === 'exact'" class="feedback ok">Correct!</p>
    <p v-else-if="result === 'typo'" class="feedback typo">
      Close enough — watch the spelling: <strong>{{ answer }}</strong>
    </p>
    <p v-else-if="result === 'wrong'" class="feedback miss">
      The answer is <strong>{{ answer }}</strong>
    </p>
  </div>
</template>

<style scoped>
.prompt {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 2.5rem 1rem;
  text-align: center;
  font-size: 1.5rem;
}
.prompt .hint {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #9ca3af;
}
.answer-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.answer-form input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
.answer-form button {
  padding: 0.6rem 1.5rem;
}
.answer-form kbd {
  font-size: 0.7rem;
  color: #9ca3af;
}
.give-up {
  margin-top: 0.5rem;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}
.feedback {
  margin-top: 1rem;
}
.feedback.ok {
  color: #16a34a;
}
.feedback.typo {
  color: #d97706;
}
.feedback.miss {
  color: #dc2626;
}
</style>
