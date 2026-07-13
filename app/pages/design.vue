<script setup lang="ts">
import type { MascotEmotion } from "~/components/SlovaMascot.vue";

// Dev-only token showcase (see DESIGN.md). Not part of the product UI.
if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

definePageMeta({ layout: false });

const { isDark, sync, toggle } = useTheme();
onMounted(sync);

const colors = [
  { token: "--color-accent", note: "primary CTA, active states" },
  { token: "--color-accent-soft", note: "hover, progress, focus ring" },
  { token: "--color-accent-subtle", note: "badge / selection bg" },
  { token: "--color-ink", note: "body text, outlines" },
  { token: "--color-ink-muted", note: "secondary text" },
  { token: "--color-ink-faint", note: "placeholders (decorative only)" },
  { token: "--color-paper", note: "page background" },
  { token: "--color-surface", note: "cards, panels" },
  { token: "--color-border", note: "borders, dividers" },
  { token: "--color-success", note: "correct, positive" },
  { token: "--color-error", note: "wrong, destructive" },
  { token: "--color-warning", note: "caution" },
];

const typeScale = [
  { cls: "text-xs", label: "text-xs 12px — captions, hints" },
  { cls: "text-sm", label: "text-sm 14px — controls, secondary" },
  { cls: "text-base", label: "text-base 16px — body" },
  { cls: "text-xl font-extrabold tracking-tight", label: "text-xl 800 — section heading" },
  { cls: "text-2xl font-extrabold tracking-tight", label: "text-2xl 800 — page heading" },
  { cls: "text-3xl font-extrabold tracking-tight", label: "text-3xl 800 — hero / stats" },
];

const radii = [
  { cls: "rounded-lg", label: "sm · 8px · rounded-lg" },
  { cls: "rounded-xl", label: "md · 12px · rounded-xl" },
  { cls: "rounded-card", label: "card · 12px · rounded-card" },
  { cls: "rounded-2xl", label: "lg · 16px · rounded-2xl" },
];

const emotions: MascotEmotion[] = ["hello", "yay", "oops", "sleep", "wink"];
const mascotSize = ref(96);
</script>

<template>
  <div class="min-h-screen bg-paper px-4 py-8 text-ink">
    <div class="mx-auto max-w-3xl">
      <header class="mb-10 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight">Slova design tokens</h1>
          <p class="text-sm text-ink-muted">Dev-only showcase — rules in DESIGN.md</p>
        </div>
        <button
          type="button"
          class="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm shadow-card transition-colors duration-150 hover:bg-accent-subtle focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
          @click="toggle"
        >
          {{ isDark ? "☀️ Light" : "🌙 Dark" }}
        </button>
      </header>

      <!-- Palette: current theme + always-dark panel for side-by-side check -->
      <section class="mb-10">
        <h2 class="mb-3 text-xl font-extrabold tracking-tight">Palette</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div
            v-for="(panel, i) in [
              { title: isDark ? 'Dark (current)' : 'Light (current)', dark: false },
              { title: 'Dark (forced)', dark: true },
            ]"
            :key="i"
            :class="panel.dark && 'dark'"
          >
            <div class="rounded-card border border-border bg-paper p-4 shadow-card">
              <h3 class="mb-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                {{ panel.title }}
              </h3>
              <ul class="space-y-1.5">
                <li v-for="c in colors" :key="c.token" class="flex items-center gap-3">
                  <span
                    class="h-8 w-8 shrink-0 rounded-lg border border-border"
                    :style="{ background: `var(${c.token})` }"
                  />
                  <span class="min-w-0 text-sm text-ink">
                    <code class="text-xs">{{ c.token }}</code>
                    <span class="block truncate text-xs text-ink-muted">{{ c.note }}</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="mb-3 text-xl font-extrabold tracking-tight">Typography</h2>
        <div class="space-y-2 rounded-card border border-border bg-surface p-4 shadow-card">
          <p v-for="t in typeScale" :key="t.cls" :class="t.cls">{{ t.label }}</p>
          <p class="text-sm text-ink-muted">Secondary copy — ink-muted</p>
          <p class="text-sm text-ink-faint">Placeholder / caption — ink-faint (decorative only)</p>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="mb-3 text-xl font-extrabold tracking-tight">Radii & shadows</h2>
        <div class="flex flex-wrap items-end gap-4">
          <div
            v-for="r in radii"
            :key="r.label"
            class="flex h-24 w-40 items-center justify-center border border-border bg-surface p-2 text-center text-xs text-ink-muted shadow-card"
            :class="r.cls"
          >
            {{ r.label }}
          </div>
          <div
            class="flex h-24 w-40 items-center justify-center rounded-card bg-surface p-2 text-center text-xs text-ink-muted shadow-pop"
          >
            shadow-pop (modals)
          </div>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="mb-3 text-xl font-extrabold tracking-tight">Buttons</h2>
        <div
          class="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
        >
          <button
            type="button"
            class="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-paper transition-colors duration-150 hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
          >
            Primary
          </button>
          <button
            type="button"
            class="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-accent-subtle focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
          >
            Secondary
          </button>
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted transition-colors duration-150 hover:text-accent focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
          >
            Ghost
          </button>
        </div>
      </section>

      <section class="mb-10">
        <h2 class="mb-3 text-xl font-extrabold tracking-tight">Mascot</h2>
        <div class="rounded-card border border-border bg-surface p-4 shadow-card">
          <div class="mb-4 flex items-center gap-2">
            <span class="text-sm text-ink-muted">Size:</span>
            <button
              v-for="s in [48, 96, 160]"
              :key="s"
              type="button"
              class="rounded-lg border px-3 py-1 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
              :class="
                mascotSize === s
                  ? 'border-accent bg-accent-subtle font-semibold text-accent'
                  : 'border-border text-ink-muted hover:bg-accent-subtle'
              "
              @click="mascotSize = s"
            >
              {{ s }}px
            </button>
          </div>
          <div class="flex flex-wrap items-end gap-6">
            <figure v-for="e in emotions" :key="e" class="text-center">
              <SlovaMascot :emotion="e" :size="mascotSize" />
              <figcaption class="mt-1 text-xs text-ink-muted">{{ e }}</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
