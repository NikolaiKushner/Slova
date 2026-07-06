<script setup lang="ts">
const props = defineProps<{ text: string }>();
const { speak } = useSpeech();

// stop propagation so the button works inside clickable cards (flashcard flip)
function onClick(event: MouseEvent) {
  event.stopPropagation();
  speak(props.text);
}
</script>

<template>
  <button
    type="button"
    class="inline-flex cursor-pointer items-center justify-center rounded-full p-1 text-base leading-none opacity-60 transition-opacity hover:opacity-100"
    title="Listen"
    aria-label="Listen"
    @click="onClick"
  >
    🔊
  </button>
</template>
