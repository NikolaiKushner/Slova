<script setup lang="ts">
// Two-step destructive button: the first click arms it, the second confirms.
// Arming wears off after a moment so a stray click can't linger as a trap.
withDefaults(defineProps<{ label?: string; confirmLabel?: string }>(), {
  label: "Delete",
  confirmLabel: "Really delete?",
});
const emit = defineEmits<{ confirm: [] }>();

const armed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function onClick() {
  clearTimeout(timer);
  if (armed.value) {
    armed.value = false;
    emit("confirm");
  } else {
    armed.value = true;
    timer = setTimeout(() => (armed.value = false), 3000);
  }
}

onUnmounted(() => clearTimeout(timer));
</script>

<template>
  <button
    type="button"
    class="btn px-2 py-1 text-xs whitespace-nowrap"
    :class="
      armed &&
      'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900'
    "
    @click="onClick"
  >
    {{ armed ? confirmLabel : label }}
  </button>
</template>
