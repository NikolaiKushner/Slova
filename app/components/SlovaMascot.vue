<script lang="ts">
// Slova mascot: a flashcard with a folded corner and a face. All colors come
// from design tokens (see DESIGN.md) so it adapts to the dark theme for free.
export type MascotEmotion = "hello" | "yay" | "oops" | "sleep" | "wink";
</script>

<script setup lang="ts">
withDefaults(defineProps<{ size?: number; emotion?: MascotEmotion }>(), {
  size: 96,
  emotion: "hello",
});
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="`Slova mascot (${emotion})`"
  >
    <!-- "z z" floats above the folded corner, outside the tilted group -->
    <template v-if="emotion === 'sleep'">
      <text
        x="76"
        y="18"
        font-size="13"
        font-weight="800"
        fill="var(--color-accent)"
        transform="rotate(-8 76 18)"
      >
        z
      </text>
      <text
        x="86"
        y="10"
        font-size="9"
        font-weight="800"
        fill="var(--color-accent)"
        transform="rotate(-8 86 10)"
      >
        z
      </text>
    </template>

    <g transform="rotate(-5 50 50)">
      <!-- card body with folded top-right corner -->
      <path
        d="M 34 14 H 62 L 74 26 V 70 A 8 8 0 0 1 66 78 H 34 A 8 8 0 0 1 26 70 V 22 A 8 8 0 0 1 34 14 Z"
        fill="var(--color-surface)"
        stroke="var(--color-ink)"
        stroke-width="4.2"
        stroke-linejoin="round"
      />
      <path d="M 62 14 V 21 A 5 5 0 0 0 67 26 H 74 Z" fill="var(--color-accent)" />

      <!-- eyes -->
      <template v-if="emotion === 'hello'">
        <circle cx="41" cy="49" r="3.4" fill="var(--color-ink)" />
        <circle cx="59" cy="49" r="3.4" fill="var(--color-ink)" />
      </template>
      <template v-else-if="emotion === 'yay'">
        <path
          d="M 36.5 50.5 Q 41 45.5 45.5 50.5"
          fill="none"
          stroke="var(--color-ink)"
          stroke-width="4.2"
          stroke-linecap="round"
        />
        <path
          d="M 54.5 50.5 Q 59 45.5 63.5 50.5"
          fill="none"
          stroke="var(--color-ink)"
          stroke-width="4.2"
          stroke-linecap="round"
        />
      </template>
      <template v-else-if="emotion === 'oops'">
        <path
          d="M 37.5 47.5 L 44.5 50"
          fill="none"
          stroke="var(--color-ink)"
          stroke-width="4.2"
          stroke-linecap="round"
        />
        <path
          d="M 55.5 50 L 62.5 47.5"
          fill="none"
          stroke="var(--color-ink)"
          stroke-width="4.2"
          stroke-linecap="round"
        />
      </template>
      <template v-else-if="emotion === 'sleep'">
        <path
          d="M 37.5 49 L 44.5 49"
          fill="none"
          stroke="var(--color-ink)"
          stroke-width="4.2"
          stroke-linecap="round"
        />
        <path
          d="M 55.5 49 L 62.5 49"
          fill="none"
          stroke="var(--color-ink)"
          stroke-width="4.2"
          stroke-linecap="round"
        />
      </template>
      <template v-else-if="emotion === 'wink'">
        <circle cx="41" cy="49" r="3.4" fill="var(--color-ink)" />
        <path
          d="M 54.5 51 Q 59 46.5 63.5 51"
          fill="none"
          stroke="var(--color-ink)"
          stroke-width="4.2"
          stroke-linecap="round"
        />
      </template>

      <!-- mouth -->
      <path
        v-if="emotion === 'hello' || emotion === 'wink'"
        d="M 41 60 Q 50 67 59 60"
        fill="none"
        stroke="var(--color-ink)"
        stroke-width="4.2"
        stroke-linecap="round"
      />
      <path
        v-else-if="emotion === 'yay'"
        d="M 41.5 58.5 Q 50 69.5 58.5 58.5 Z"
        fill="var(--color-ink)"
        stroke="var(--color-ink)"
        stroke-width="2.5"
        stroke-linejoin="round"
      />
      <circle
        v-else-if="emotion === 'oops'"
        cx="50"
        cy="62.5"
        r="3.2"
        fill="none"
        stroke="var(--color-ink)"
        stroke-width="3.6"
      />
      <circle v-else-if="emotion === 'sleep'" cx="50" cy="62" r="2.4" fill="var(--color-ink)" />

      <!-- extras -->
      <template v-if="emotion === 'yay'">
        <circle cx="34.5" cy="57.5" r="2.6" fill="var(--color-accent-soft)" />
        <circle cx="65.5" cy="57.5" r="2.6" fill="var(--color-accent-soft)" />
      </template>
      <path
        v-if="emotion === 'oops'"
        d="M 80 10.5 C 83.5 15.5 84.5 18.5 82.5 21 C 81 22.7 78.6 22.7 77.1 21 C 75.1 18.5 76.5 15.5 80 10.5 Z"
        fill="var(--color-accent)"
      />
    </g>
  </svg>
</template>
