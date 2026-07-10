<script setup lang="ts">
// Column chart of a per-day count. Pure inline SVG — no chart library —
// sized by viewBox so it scales with the container.
const props = withDefaults(
  defineProps<{
    days: { day: string; reviews: number }[];
    // Tooltip wording and accessible caption, so the same chart can show
    // past reviews or the upcoming due forecast.
    noun?: [singular: string, plural: string];
    caption?: string;
  }>(),
  {
    noun: () => ["review", "reviews"],
    caption: "Reviews per day, last 14 days",
  },
);

const W = 560;
const H = 150;
const PAD = { top: 18, right: 6, bottom: 20, left: 30 };
const BAR_MAX = 24;
const RADIUS = 4;

const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;
const baseline = PAD.top + plotH;

// Round the axis max up to a clean number so ticks read as 0 / half / max.
const yMax = computed(() => {
  const max = Math.max(...props.days.map((d) => d.reviews), 0);
  if (max <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 4, 5, 10]) {
    const nice = m * pow;
    if (nice >= max && nice % 2 === 0) return nice;
  }
  return 10 * pow;
});

const band = computed(() => plotW / props.days.length);
const barWidth = computed(() => Math.min(BAR_MAX, band.value - 4));

interface Bar {
  index: number;
  day: string;
  reviews: number;
  x: number;
  y: number;
  path: string;
  isMax: boolean;
}

const bars = computed<Bar[]>(() => {
  const maxReviews = Math.max(...props.days.map((d) => d.reviews));
  let maxLabeled = false;
  return props.days.map((d, index) => {
    const w = barWidth.value;
    const x = PAD.left + index * band.value + (band.value - w) / 2;
    const h = (d.reviews / yMax.value) * plotH;
    const y = baseline - h;
    // Rounded top corners, square at the baseline.
    const r = Math.min(RADIUS, h, w / 2);
    const path = h
      ? `M${x},${baseline} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${baseline} Z`
      : "";
    // Direct-label only the busiest day; the tooltip carries the rest.
    const isMax = !maxLabeled && d.reviews === maxReviews && d.reviews > 0;
    if (isMax) maxLabeled = true;
    return { index, day: d.day, reviews: d.reviews, x, y, path, isMax };
  });
});

function dayOfMonth(iso: string) {
  return Number(iso.slice(8, 10));
}

// Label every other day; add the month on the first tick and on month changes.
const xTicks = computed(() =>
  props.days
    .map((d, index) => ({ d, index }))
    .filter(({ index }) => index % 2 === 0)
    .map(({ d, index }, tickIdx, ticks) => {
      const month = new Date(`${d.day}T00:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
      });
      const prev = ticks[tickIdx - 1]?.d.day.slice(0, 7);
      const label =
        tickIdx === 0 || d.day.slice(0, 7) !== prev
          ? `${month} ${dayOfMonth(d.day)}`
          : String(dayOfMonth(d.day));
      return { label, x: PAD.left + (index + 0.5) * band.value };
    }),
);

function tooltipDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const hovered = ref<Bar | null>(null);
</script>

<template>
  <div class="relative">
    <svg :viewBox="`0 0 ${W} ${H}`" class="block w-full" role="img" :aria-label="caption">
      <!-- gridlines + y ticks at 0 / half / max -->
      <g v-for="frac in [0.5, 1]" :key="frac">
        <line
          :x1="PAD.left"
          :x2="W - PAD.right"
          :y1="baseline - frac * plotH"
          :y2="baseline - frac * plotH"
          class="stroke-gray-200 dark:stroke-gray-800"
          stroke-width="1"
        />
        <text
          :x="PAD.left - 6"
          :y="baseline - frac * plotH + 3"
          text-anchor="end"
          class="fill-gray-400 text-[10px] tabular-nums dark:fill-gray-500"
        >
          {{ frac * yMax }}
        </text>
      </g>
      <line
        :x1="PAD.left"
        :x2="W - PAD.right"
        :y1="baseline"
        :y2="baseline"
        class="stroke-gray-300 dark:stroke-gray-700"
        stroke-width="1"
      />
      <text
        :x="PAD.left - 6"
        :y="baseline + 3"
        text-anchor="end"
        class="fill-gray-400 text-[10px] tabular-nums dark:fill-gray-500"
      >
        0
      </text>

      <!-- columns -->
      <g v-for="bar in bars" :key="bar.day">
        <path
          v-if="bar.path"
          :d="bar.path"
          class="fill-blue-600 dark:fill-blue-500"
          :class="{ 'opacity-80': hovered && hovered.day !== bar.day }"
        />
        <text
          v-if="bar.isMax && !hovered"
          :x="bar.x + barWidth / 2"
          :y="bar.y - 5"
          text-anchor="middle"
          class="fill-gray-700 text-[10px] font-semibold tabular-nums dark:fill-gray-300"
        >
          {{ bar.reviews }}
        </text>
        <!-- full-band transparent hit target so hover works on short/empty bars -->
        <rect
          :x="PAD.left + bar.index * band"
          :y="PAD.top"
          :width="band"
          :height="plotH"
          fill="transparent"
          @pointerenter="hovered = bar"
          @pointerleave="hovered = null"
        />
      </g>

      <!-- x labels -->
      <text
        v-for="tick in xTicks"
        :key="tick.x"
        :x="tick.x"
        :y="H - 6"
        text-anchor="middle"
        class="fill-gray-400 text-[10px] dark:fill-gray-500"
      >
        {{ tick.label }}
      </text>
    </svg>

    <div
      v-if="hovered"
      class="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs whitespace-nowrap text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
      :style="{ left: `${((PAD.left + (hovered.index + 0.5) * band) / W) * 100}%` }"
    >
      <span class="font-semibold tabular-nums">{{ hovered.reviews }}</span>
      {{ hovered.reviews === 1 ? noun[0] : noun[1] }}
      <span class="text-gray-400 dark:text-gray-500">· {{ tooltipDate(hovered.day) }}</span>
    </div>

    <table class="sr-only">
      <caption>{{ caption }}</caption>
      <tbody>
        <tr v-for="d in days" :key="d.day">
          <th scope="row">{{ d.day }}</th>
          <td>{{ d.reviews }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
