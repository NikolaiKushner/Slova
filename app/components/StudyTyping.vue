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
    <div class="rounded-xl border border-gray-200 px-4 py-10 text-center text-2xl dark:border-gray-800">
      <p>{{ front }} <SpeakButton :text="front" /></p>
      <span class="mt-3 block text-xs text-gray-400 dark:text-gray-500">Type the answer</span>
    </div>

    <form class="mt-4 flex gap-2" @submit.prevent="submit">
      <input
        ref="inputEl"
        v-model="input"
        class="input flex-1 py-2.5 text-base"
        :readonly="result !== null"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Your answer…"
      />
      <button v-if="!result" type="submit" class="btn btn-primary px-6">Check</button>
      <button v-else type="submit" class="btn btn-primary px-6">
        Next <kbd class="text-xs opacity-70">Enter</kbd>
      </button>
    </form>
    <button
      v-if="!result"
      type="button"
      class="mt-2 cursor-pointer text-sm text-gray-500 underline dark:text-gray-400"
      @click="giveUp"
    >
      I don't know
    </button>

    <p v-if="result === 'exact'" class="mt-4 text-green-600 dark:text-green-400">Correct!</p>
    <p v-else-if="result === 'typo'" class="mt-4 text-amber-600 dark:text-amber-400">
      Close enough — watch the spelling: <strong>{{ answer }}</strong>
    </p>
    <p v-else-if="result === 'wrong'" class="mt-4 text-red-600 dark:text-red-400">
      The answer is <strong>{{ answer }}</strong>
    </p>
  </div>
</template>
