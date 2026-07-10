<script setup lang="ts">
// GitHub-style activity calendar: one cell per day, weeks as columns,
// Monday-first, ending today. Sequential single-hue ramp — intensity is the
// only thing color encodes; exact values live in the tooltip and the
// screen-reader table.
const props = defineProps<{ days: { day: string; reviews: number }[] }>();

interface Cell {
  day: string;
  reviews: number;
}

const weeks = computed<(Cell | null)[][]>(() => {
  const first = props.days[0];
  if (!first) return [];
  // Pad the front so the first column starts on a Monday.
  const mondayOffset = (new Date(`${first.day}T00:00:00Z`).getUTCDay() + 6) % 7;
  const padded: (Cell | null)[] = [...Array(mondayOffset).fill(null), ...props.days];
  const out: (Cell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    out.push(week);
  }
  return out;
});

// Fixed buckets so intensity reads the same from week to week.
function bucket(reviews: number) {
  if (reviews === 0) return 0;
  if (reviews < 5) return 1;
  if (reviews < 10) return 2;
  if (reviews < 20) return 3;
  return 4;
}

// Sequential blue ramp, light→dark in light mode; dark mode has its own
// steps against the dark surface (validated lightness-monotonic both ways).
const BUCKET_CLASSES = [
  "bg-gray-100 dark:bg-gray-800",
  "bg-blue-200 dark:bg-blue-900",
  "bg-blue-400 dark:bg-blue-700",
  "bg-blue-600 dark:bg-blue-500",
  "bg-blue-800 dark:bg-blue-300",
];

// A month label above the first column that contains that month's 1st.
const monthLabels = computed(() =>
  weeks.value
    .map((week, index) => {
      const firstOfMonth = week.find((cell) => cell && cell.day.slice(8, 10) === "01");
      if (!firstOfMonth) return null;
      return {
        index,
        label: new Date(`${firstOfMonth.day}T00:00:00Z`).toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
        }),
      };
    })
    .filter((m): m is { index: number; label: string } => m !== null),
);

const hovered = ref<(Cell & { weekIndex: number }) | null>(null);

function tooltipDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
</script>

<template>
  <div class="relative overflow-x-auto pb-1">
    <div class="inline-flex flex-col">
      <!-- month labels -->
      <div class="relative mb-1 ml-8 h-4 text-[10px] text-gray-400 dark:text-gray-500">
        <span
          v-for="month in monthLabels"
          :key="month.index"
          class="absolute"
          :style="{ left: `${month.index * 15}px` }"
        >
          {{ month.label }}
        </span>
      </div>

      <div class="flex gap-1">
        <!-- weekday labels -->
        <div class="grid w-7 grid-rows-7 gap-[3px] text-[10px] text-gray-400 dark:text-gray-500">
          <span class="row-start-1 leading-3">Mon</span>
          <span class="row-start-3 leading-3">Wed</span>
          <span class="row-start-5 leading-3">Fri</span>
        </div>

        <!-- one column per week -->
        <div
          v-for="(week, weekIndex) in weeks"
          :key="weekIndex"
          class="grid grid-rows-7 gap-[3px]"
        >
          <div
            v-for="(cell, dayIndex) in week"
            :key="dayIndex"
            class="h-3 w-3 rounded-xs"
            :class="cell ? BUCKET_CLASSES[bucket(cell.reviews)] : 'bg-transparent'"
            @pointerenter="cell && (hovered = { ...cell, weekIndex })"
            @pointerleave="hovered = null"
          />
        </div>
      </div>

      <!-- intensity legend -->
      <div class="mt-1.5 ml-8 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
        <span>Less</span>
        <span v-for="(cls, i) in BUCKET_CLASSES" :key="i" class="h-3 w-3 rounded-xs" :class="cls" />
        <span>More</span>
      </div>
    </div>

    <div
      v-if="hovered"
      class="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs whitespace-nowrap text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      :style="{ left: `${44 + hovered.weekIndex * 15}px` }"
    >
      <span class="font-semibold tabular-nums">{{ hovered.reviews }}</span>
      {{ hovered.reviews === 1 ? "review" : "reviews" }}
      <span class="text-gray-400 dark:text-gray-500">· {{ tooltipDate(hovered.day) }}</span>
    </div>

    <table class="sr-only">
      <caption>Daily reviews, last 6 months</caption>
      <tbody>
        <tr v-for="d in days.filter((d) => d.reviews > 0)" :key="d.day">
          <th scope="row">{{ d.day }}</th>
          <td>{{ d.reviews }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
