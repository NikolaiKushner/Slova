<script setup lang="ts">
import type { Rating } from "~/components/StudySession.vue";

defineProps<{ front: string; back: string; saving: boolean }>();
const emit = defineEmits<{ rate: [rating: Rating] }>();

const flipped = ref(false);

function onKeydown(e: KeyboardEvent) {
  if (e.code === "Space") {
    e.preventDefault();
    flipped.value = !flipped.value;
  } else if (flipped.value && ["1", "2", "3"].includes(e.key)) {
    e.preventDefault();
    emit("rate", (["again", "hard", "good"] as const)[Number(e.key) - 1]!);
  }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <div>
    <div
      class="cursor-pointer rounded-xl border border-gray-200 px-4 py-16 text-center text-2xl select-none dark:border-gray-800"
      @click="flipped = !flipped"
    >
      <p>{{ flipped ? back : front }} <SpeakButton :text="flipped ? back : front" /></p>
      <span class="mt-4 block text-xs text-gray-400 dark:text-gray-500">
        {{ flipped ? "How well did you know it?" : "Click or press Space to flip" }}
      </span>
    </div>

    <div v-if="flipped" class="mt-4 flex gap-2">
      <button
        type="button"
        class="btn flex-1 border-red-200 bg-red-50 py-2.5 text-base hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900"
        :disabled="saving"
        @click="emit('rate', 'again')"
      >
        Again <kbd class="text-xs text-gray-400">1</kbd>
      </button>
      <button
        type="button"
        class="btn flex-1 border-amber-200 bg-amber-50 py-2.5 text-base hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900"
        :disabled="saving"
        @click="emit('rate', 'hard')"
      >
        Hard <kbd class="text-xs text-gray-400">2</kbd>
      </button>
      <button
        type="button"
        class="btn flex-1 border-green-200 bg-green-50 py-2.5 text-base hover:bg-green-100 dark:border-green-900 dark:bg-green-950 dark:hover:bg-green-900"
        :disabled="saving"
        @click="emit('rate', 'good')"
      >
        Good <kbd class="text-xs text-gray-400">3</kbd>
      </button>
    </div>
  </div>
</template>
