<script setup lang="ts">
import type { Rating } from "~/components/StudySession.vue";

const props = defineProps<{ front: string; answer: string; options: string[] }>();
const emit = defineEmits<{ answered: [rating: Rating]; next: [] }>();

const selected = ref<string | null>(null);
const answered = computed(() => selected.value !== null);

function pick(option: string) {
  if (answered.value) return;
  selected.value = option;
  emit("answered", option === props.answer ? "good" : "again");
}

function optionClass(option: string) {
  if (!answered.value)
    return "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800";
  if (option === props.answer) return "border-green-500 bg-green-50 dark:bg-green-950";
  if (option === selected.value) return "border-red-500 bg-red-50 dark:bg-red-950";
  return "border-gray-200 bg-white opacity-50 dark:border-gray-700 dark:bg-gray-900";
}

function onKeydown(e: KeyboardEvent) {
  const num = Number(e.key);
  if (!answered.value && num >= 1 && num <= props.options.length) {
    e.preventDefault();
    pick(props.options[num - 1]!);
  } else if (answered.value && (e.key === "Enter" || e.code === "Space")) {
    e.preventDefault();
    emit("next");
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div>
    <div class="rounded-xl border border-gray-200 px-4 py-10 text-center text-2xl dark:border-gray-800">
      <p>{{ front }}</p>
      <span class="mt-3 block text-xs text-gray-400 dark:text-gray-500">Pick the right answer</span>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-2">
      <button
        v-for="(option, i) in options"
        :key="option"
        type="button"
        class="cursor-pointer rounded-lg border p-3 text-left text-base"
        :class="optionClass(option)"
        @click="pick(option)"
      >
        <kbd class="mr-1 text-xs text-gray-400">{{ i + 1 }}</kbd> {{ option }}
      </button>
    </div>

    <div v-if="answered" class="mt-4 flex items-center justify-between">
      <p v-if="selected === answer" class="text-green-600 dark:text-green-400">Correct!</p>
      <p v-else class="text-red-600 dark:text-red-400">
        Not quite — the answer is <strong>{{ answer }}</strong>
      </p>
      <button type="button" class="btn px-6" @click="emit('next')">
        Next <kbd class="text-xs text-gray-400">Enter</kbd>
      </button>
    </div>
  </div>
</template>
