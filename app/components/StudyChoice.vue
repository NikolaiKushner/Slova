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
  if (!answered.value) return {};
  return {
    correct: option === props.answer,
    wrong: option === selected.value && option !== props.answer,
    faded: option !== props.answer && option !== selected.value,
  };
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
    <div class="prompt">
      <p>{{ front }}</p>
      <span class="hint">Pick the right answer</span>
    </div>

    <div class="choices">
      <button
        v-for="(option, i) in options"
        :key="option"
        type="button"
        :class="optionClass(option)"
        @click="pick(option)"
      >
        <kbd>{{ i + 1 }}</kbd> {{ option }}
      </button>
    </div>

    <div v-if="answered" class="feedback">
      <p v-if="selected === answer" class="ok">Correct!</p>
      <p v-else class="miss">
        Not quite — the answer is <strong>{{ answer }}</strong>
      </p>
      <button type="button" @click="emit('next')">Next <kbd>Enter</kbd></button>
    </div>
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
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 1rem;
}
.choices button {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
  text-align: left;
}
.choices kbd {
  font-size: 0.7rem;
  color: #9ca3af;
  margin-right: 0.35rem;
}
.choices .correct {
  background: #f0fdf4;
  border-color: #22c55e;
}
.choices .wrong {
  background: #fef2f2;
  border-color: #ef4444;
}
.choices .faded {
  opacity: 0.5;
}
.feedback {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}
.feedback .ok {
  color: #16a34a;
}
.feedback .miss {
  color: #dc2626;
}
.feedback button {
  padding: 0.5rem 1.5rem;
}
.feedback kbd {
  font-size: 0.7rem;
  color: #9ca3af;
}
</style>
