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
    <div class="flashcard" @click="flipped = !flipped">
      <p>{{ flipped ? back : front }}</p>
      <span class="hint">{{ flipped ? "How well did you know it?" : "Click or press Space to flip" }}</span>
    </div>

    <div v-if="flipped" class="ratings">
      <button type="button" class="again" :disabled="saving" @click="emit('rate', 'again')">
        Again <kbd>1</kbd>
      </button>
      <button type="button" class="hard" :disabled="saving" @click="emit('rate', 'hard')">
        Hard <kbd>2</kbd>
      </button>
      <button type="button" class="good" :disabled="saving" @click="emit('rate', 'good')">
        Good <kbd>3</kbd>
      </button>
    </div>
  </div>
</template>

<style scoped>
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
</style>
