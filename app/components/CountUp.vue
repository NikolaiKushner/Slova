<script setup lang="ts">
// Animates a number from 0 to `to` the first time it scrolls into view.
const props = withDefaults(
  defineProps<{ to: number; suffix?: string; duration?: number; decimals?: number }>(),
  { suffix: "", duration: 1500, decimals: 0 },
);

const el = ref<HTMLElement | null>(null);
const shown = ref(format(props.to)); // SSR and no-JS fallback: final value

function format(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: props.decimals,
    maximumFractionDigits: props.decimals,
  });
}

onMounted(() => {
  if (!el.value || typeof IntersectionObserver === "undefined") return;
  shown.value = format(0);
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / props.duration);
        shown.value = format(props.to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    { threshold: 0.4 },
  );
  io.observe(el.value);
});
</script>

<template>
  <span ref="el" class="tabular-nums">{{ shown }}{{ suffix }}</span>
</template>
