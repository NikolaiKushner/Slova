<script setup lang="ts">
// Public landing page. Logged-in users go straight to their dashboard.
definePageMeta({
  middleware: () => {
    const { loggedIn } = useUserSession();
    if (loggedIn.value) return navigateTo("/dashboard");
  },
});

useHead({ title: "Slova — learn words that stick" });

// A tiny hands-on demo of the flashcard mode, no account needed.
const demoCards = [
  { term: "resilient", definition: "устойчивый, стойкий" },
  { term: "curiosity", definition: "любопытство" },
  { term: "to accomplish", definition: "достигать, выполнять" },
  { term: "seamless", definition: "бесшовный, плавный" },
];
const demoIndex = ref(0);
const demoFlipped = ref(false);
const demoCard = computed(() => demoCards[demoIndex.value]!);

function nextDemoCard() {
  demoFlipped.value = false;
  demoIndex.value = (demoIndex.value + 1) % demoCards.length;
}

const features = [
  {
    icon: "🧠",
    title: "Spaced repetition",
    text: "An SM-2 scheduler (the Anki family) decides when each word comes back — right before you'd forget it.",
  },
  {
    icon: "🃏",
    title: "Four study modes",
    text: "Flip cards, multiple choice, typing with typo tolerance, and match-the-pairs — all feed the same scheduler.",
  },
  {
    icon: "📦",
    title: "Starter packs",
    text: "Curated English vocabulary grouped by CEFR level (A1–B1), ready to study in one click.",
  },
  {
    icon: "📥",
    title: "Import & export",
    text: "Bring words in from CSV or plain text, take them out the same way. Your data stays yours.",
  },
  {
    icon: "🔊",
    title: "Pronunciation",
    text: "Hear any word spoken aloud with the browser's built-in speech — no plugins, no accounts.",
  },
  {
    icon: "🔥",
    title: "Streaks & progress",
    text: "A study-day streak, due-card counts, and per-set progress bars keep you coming back.",
  },
];
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="py-10 text-center sm:py-14">
      <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
        Learn words that
        <span class="text-blue-600 dark:text-blue-400">stick</span>
      </h1>
      <p class="mx-auto mt-4 max-w-md text-lg text-gray-600 dark:text-gray-300">
        Slova is a flashcard app built on spaced repetition: study a few minutes a day,
        and it schedules every word right before you'd forget it.
      </p>
      <div class="mt-7 flex justify-center gap-3">
        <NuxtLink to="/register" class="btn btn-primary px-5 py-2.5 text-base">
          Get started — it's free
        </NuxtLink>
        <NuxtLink to="/login" class="btn px-5 py-2.5 text-base">Log in</NuxtLink>
      </div>
    </section>

    <!-- Live demo card -->
    <section class="mx-auto max-w-md">
      <p class="mb-2 text-center text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
        Try it — no account needed
      </p>
      <div
        class="cursor-pointer rounded-xl border border-gray-200 bg-white px-4 py-14 text-center text-2xl shadow-sm select-none dark:border-gray-800 dark:bg-gray-900"
        @click="demoFlipped = !demoFlipped"
      >
        <p>{{ demoFlipped ? demoCard.definition : demoCard.term }}</p>
        <span class="mt-4 block text-xs text-gray-400 dark:text-gray-500">
          {{ demoFlipped ? "Got it? On to the next one" : "Click to flip" }}
        </span>
      </div>
      <div class="mt-3 flex justify-center">
        <button type="button" class="btn" @click="nextDemoCard">Next word →</button>
      </div>
    </section>

    <!-- Features -->
    <section class="mt-14">
      <h2 class="mb-6 text-center text-2xl font-bold">Everything you need to actually remember</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="rounded-lg border border-gray-200 px-4 py-3.5 dark:border-gray-800"
        >
          <h3 class="font-semibold">{{ feature.icon }} {{ feature.title }}</h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ feature.text }}</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="mt-14">
      <h2 class="mb-6 text-center text-2xl font-bold">How it works</h2>
      <ol class="mx-auto flex max-w-md flex-col gap-4">
        <li class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
          >
            1
          </span>
          <p class="text-gray-600 dark:text-gray-300">
            <strong class="text-gray-900 dark:text-gray-100">Add words.</strong>
            Create a set, import from CSV, or grab a curated starter pack for your level.
          </p>
        </li>
        <li class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
          >
            2
          </span>
          <p class="text-gray-600 dark:text-gray-300">
            <strong class="text-gray-900 dark:text-gray-100">Study a few minutes a day.</strong>
            Pick a mode — flashcards, choice, typing, or match — and rate how well you knew each word.
          </p>
        </li>
        <li class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
          >
            3
          </span>
          <p class="text-gray-600 dark:text-gray-300">
            <strong class="text-gray-900 dark:text-gray-100">Let the scheduler do the rest.</strong>
            Words you know drift weeks out; words you miss come right back. Show up, clear your due cards, keep the streak.
          </p>
        </li>
      </ol>
    </section>

    <!-- Final CTA -->
    <section class="mt-14 mb-6 rounded-xl border border-blue-200 bg-blue-50 px-6 py-8 text-center dark:border-blue-900 dark:bg-blue-950">
      <h2 class="text-xl font-bold">Start remembering more today</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Free, open source, and your first pack is one click away.
      </p>
      <NuxtLink to="/register" class="btn btn-primary mt-4 px-5 py-2.5 text-base">Create account</NuxtLink>
    </section>
  </div>
</template>
