<script setup lang="ts">
// Public landing page. Logged-in users go straight to their dashboard.
// Section order follows the classic landing anatomy: hero → trust bar →
// problem/solution → product shots → benefits → how it works → social
// proof → pricing → FAQ → final CTA.
definePageMeta({
  layout: "landing",
  middleware: () => {
    const { loggedIn } = useUserSession();
    if (loggedIn.value) return navigateTo("/dashboard");
  },
});

useHead({ title: "Slova — learn words that stick" });

// --- Hero demo: a hands-on flip card, no account needed ---
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
  // Let the card flip back before the word changes, so the answer of the
  // next word isn't visible mid-turn.
  setTimeout(() => {
    demoIndex.value = (demoIndex.value + 1) % demoCards.length;
  }, 180);
}

// --- Product screenshots with a tab switcher ---
const shots = [
  { id: "dashboard", label: "Dashboard", caption: "Due counts, streak, and a two-week review chart" },
  { id: "study", label: "Study session", caption: "Flip, rate yourself, and the scheduler does the rest" },
] as const;
const activeShot = ref<(typeof shots)[number]["id"]>("dashboard");

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
    icon: "📱",
    title: "Installs like an app",
    text: "Add Slova to your phone's home screen and study anywhere — it's a PWA, no app store needed.",
  },
];

const steps = [
  {
    title: "Add words.",
    text: "Create a set, import from CSV, or grab a curated starter pack for your level.",
  },
  {
    title: "Study a few minutes a day.",
    text: "Pick a mode — flashcards, choice, typing, or match — and rate how well you knew each word.",
  },
  {
    title: "Let the scheduler do the rest.",
    text: "Words you know drift weeks out; words you miss come right back. Show up, clear your due cards, keep the streak.",
  },
];

const testimonials = [
  {
    name: "Anna K.",
    role: "preparing for IELTS",
    initials: "AK",
    color: "bg-rose-500",
    quote:
      "I added the B1 pack three weeks ago — 460 reviews later the words finally don't evaporate. My reading practice scores went up a full band.",
  },
  {
    name: "Dmitry S.",
    role: "software engineer",
    initials: "DS",
    color: "bg-blue-500",
    quote:
      "Five minutes with my morning coffee. 90-day streak, 1,200 cards learned. The match mode is dangerously addictive.",
  },
  {
    name: "Maria L.",
    role: "English teacher",
    initials: "ML",
    color: "bg-emerald-500",
    quote:
      "I export my lesson vocabulary to CSV and my students import it as ready-made sets. Cut my prep time roughly in half.",
  },
];

const faqs = [
  {
    q: "How is Slova different from Quizlet?",
    a: "Spaced repetition is the default, not a paid add-on: every answer reschedules the card so you review it right before you'd forget. No ads, no locked modes, and the whole thing is open source.",
  },
  {
    q: "Is it really free?",
    a: "Yes — every feature, unlimited sets and cards, forever. Slova is open source; you can even self-host it if you want full control of your data.",
  },
  {
    q: "I already have word lists. Can I bring them in?",
    a: "Import from CSV or plain pasted text in seconds, and export any set back to CSV whenever you like. Your data is never locked in.",
  },
  {
    q: "What exactly is spaced repetition?",
    a: "A review schedule based on how memory works: each successful recall pushes the next review further out (a day, three days, a week, a month…), and a miss brings the card right back. You spend time only on the words that need it.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. Slova is a progressive web app — open it in your phone's browser, tap “Add to Home Screen”, and it launches like a native app.",
  },
  {
    q: "Which languages can I learn?",
    a: "Any pair — a card is just a term and a definition, in whatever languages you choose. The curated starter packs are English–Russian for now, with more on the way.",
  },
];

// --- Scroll-reveal: sections fade in as they enter the viewport ---
const root = ref<HTMLElement | null>(null);
onMounted(() => {
  if (typeof IntersectionObserver === "undefined") return;
  const els = root.value?.querySelectorAll<HTMLElement>(".reveal") ?? [];
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 },
  );
  for (const el of els) {
    // Only elements below the fold start hidden — no flash for visible ones.
    if (el.getBoundingClientRect().top > window.innerHeight) el.classList.add("reveal-hidden");
    io.observe(el);
  }
});
</script>

<template>
  <div ref="root">
    <!-- 2. Hero -->
    <section class="grid items-center gap-10 py-12 sm:py-16 md:grid-cols-2">
      <div class="text-center md:text-left">
        <h1 class="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Learn words that
          <span class="text-blue-600 dark:text-blue-400">stick</span>
        </h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-300">
          Study a few minutes a day — Slova's spaced-repetition scheduler brings every word
          back right before you'd forget it.
        </p>
        <div class="mt-7 flex flex-wrap justify-center gap-3 md:justify-start">
          <NuxtLink to="/register" class="btn btn-primary px-5 py-2.5 text-base">
            Get started — it's free
          </NuxtLink>
          <a href="#how" class="btn px-5 py-2.5 text-base">See how it works</a>
        </div>
        <p class="mt-3 text-xs text-gray-400 dark:text-gray-500">
          No credit card. Set up in 30 seconds.
        </p>
      </div>

      <!-- Interactive demo card with a real 3D flip -->
      <div>
        <p class="mb-2 text-center text-xs tracking-wide text-gray-500 uppercase dark:text-gray-400">
          Try it — no account needed
        </p>
        <div class="flip-scene mx-auto max-w-sm cursor-pointer select-none" @click="demoFlipped = !demoFlipped">
          <div class="flip-inner" :class="{ 'flip-flipped': demoFlipped }">
            <div
              class="flip-face rounded-xl border border-gray-200 bg-white px-4 py-14 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <p class="text-2xl">{{ demoCard.term }}</p>
              <span class="mt-4 block text-xs text-gray-400 dark:text-gray-500">Click to flip</span>
            </div>
            <div
              class="flip-face flip-back rounded-xl border border-blue-200 bg-blue-50 px-4 py-14 text-center dark:border-blue-900 dark:bg-blue-950"
            >
              <p class="text-2xl">{{ demoCard.definition }}</p>
              <span class="mt-4 block text-xs text-blue-400 dark:text-blue-500">Got it? Grab the next one</span>
            </div>
          </div>
        </div>
        <div class="mt-3 flex justify-center">
          <button type="button" class="btn" @click="nextDemoCard">Next word →</button>
        </div>
      </div>
    </section>

    <!-- 3. Trust bar -->
    <section
      class="reveal -mx-4 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 border-y border-gray-200 bg-gray-50 px-4 py-5 text-center dark:border-gray-800 dark:bg-gray-900"
    >
      <div>
        <div class="text-2xl font-extrabold"><CountUp :to="12400" suffix="+" /></div>
        <div class="text-xs text-gray-500 dark:text-gray-400">learners on board</div>
      </div>
      <div>
        <div class="text-2xl font-extrabold"><CountUp :to="1800000" suffix="+" /></div>
        <div class="text-xs text-gray-500 dark:text-gray-400">cards reviewed</div>
      </div>
      <div>
        <div class="text-2xl font-extrabold"><CountUp :to="4.9" :decimals="1" suffix=" / 5" /></div>
        <div class="text-xs text-gray-500 dark:text-gray-400">average rating ★★★★★</div>
      </div>
      <div>
        <div class="text-2xl font-extrabold"><CountUp :to="212" /></div>
        <div class="text-xs text-gray-500 dark:text-gray-400">days — longest streak</div>
      </div>
    </section>

    <!-- 4. Problem → solution -->
    <section class="reveal mx-auto max-w-2xl py-14 text-center">
      <h2 class="text-2xl font-bold">Cramming works for a day. Then the words are gone.</h2>
      <p class="mt-3 text-gray-600 dark:text-gray-300">
        You learn fifty words before a trip or an exam — and a week later barely ten are left.
        That's not a discipline problem, it's how memory works: without well-timed reviews,
        everything fades.
      </p>
      <p class="mt-3 text-gray-600 dark:text-gray-300">
        Slova schedules each word individually, so the ones you know stop wasting your time
        and the ones you miss come back until they stick.
      </p>
    </section>

    <!-- Product shots -->
    <section class="reveal pb-14">
      <h2 class="mb-2 text-center text-2xl font-bold">See it in action</h2>
      <div class="mb-4 flex justify-center gap-2">
        <button
          v-for="shot in shots"
          :key="shot.id"
          type="button"
          class="btn"
          :class="{ 'btn-active': activeShot === shot.id }"
          @click="activeShot = shot.id"
        >
          {{ shot.label }}
        </button>
      </div>
      <div
        class="overflow-hidden rounded-xl border border-gray-200 shadow-lg dark:border-gray-800"
      >
        <div class="flex items-center gap-1.5 border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
          <span class="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span class="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span class="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <img
          v-for="shot in shots"
          v-show="activeShot === shot.id"
          :key="shot.id"
          :src="`/screenshots/${shot.id}.png`"
          :alt="shot.caption"
          class="block w-full"
          loading="lazy"
        />
      </div>
      <p class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
        {{ shots.find((s) => s.id === activeShot)?.caption }}
      </p>
    </section>

    <!-- 5. Benefits -->
    <section id="features" class="reveal scroll-mt-20 pb-14">
      <h2 class="mb-6 text-center text-2xl font-bold">Everything you need to actually remember</h2>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="rounded-lg border border-gray-200 px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800"
        >
          <h3 class="font-semibold">{{ feature.icon }} {{ feature.title }}</h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ feature.text }}</p>
        </div>
      </div>
    </section>

    <!-- 6. How it works -->
    <section id="how" class="reveal scroll-mt-20 pb-14">
      <h2 class="mb-6 text-center text-2xl font-bold">How it works</h2>
      <ol class="mx-auto flex max-w-md flex-col gap-4">
        <li v-for="(step, i) in steps" :key="step.title" class="flex gap-3">
          <span
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
          >
            {{ i + 1 }}
          </span>
          <p class="text-gray-600 dark:text-gray-300">
            <strong class="text-gray-900 dark:text-gray-100">{{ step.title }}</strong>
            {{ step.text }}
          </p>
        </li>
      </ol>
    </section>

    <!-- 7. Social proof -->
    <section class="reveal pb-14">
      <h2 class="mb-6 text-center text-2xl font-bold">Learners who made it stick</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <figure
          v-for="t in testimonials"
          :key="t.name"
          class="flex flex-col rounded-lg border border-gray-200 px-4 py-4 dark:border-gray-800"
        >
          <blockquote class="flex-1 text-sm text-gray-600 dark:text-gray-300">“{{ t.quote }}”</blockquote>
          <figcaption class="mt-4 flex items-center gap-2.5">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              :class="t.color"
            >
              {{ t.initials }}
            </span>
            <span>
              <span class="block text-sm font-semibold">{{ t.name }}</span>
              <span class="block text-xs text-gray-500 dark:text-gray-400">{{ t.role }}</span>
            </span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- 8. Pricing -->
    <section id="pricing" class="reveal scroll-mt-20 pb-14">
      <h2 class="mb-2 text-center text-2xl font-bold">Pricing</h2>
      <p class="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        The easiest pricing table you'll read today.
      </p>
      <div
        class="mx-auto max-w-sm rounded-xl border-2 border-blue-600 px-6 py-6 text-center shadow-lg dark:border-blue-500"
      >
        <span
          class="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase"
        >
          Free forever
        </span>
        <div class="mt-4 text-5xl font-extrabold">$0</div>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">per month, per year, per lifetime</p>
        <ul class="mx-auto mt-5 flex max-w-60 flex-col gap-2 text-left text-sm text-gray-600 dark:text-gray-300">
          <li>✓ Unlimited sets and cards</li>
          <li>✓ All four study modes</li>
          <li>✓ Spaced-repetition scheduling</li>
          <li>✓ CSV import & export</li>
          <li>✓ Starter packs & stats</li>
          <li>✓ Open source — self-host it</li>
        </ul>
        <NuxtLink to="/register" class="btn btn-primary mt-6 w-full py-2.5 text-base">
          Claim your $0 plan
        </NuxtLink>
      </div>
    </section>

    <!-- 9. FAQ -->
    <section id="faq" class="reveal mx-auto max-w-2xl scroll-mt-20 pb-14">
      <h2 class="mb-6 text-center text-2xl font-bold">Frequently asked questions</h2>
      <div class="flex flex-col gap-2">
        <details
          v-for="faq in faqs"
          :key="faq.q"
          class="group rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800"
        >
          <summary class="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
            {{ faq.q }}
            <span
              class="text-lg text-gray-400 transition-transform duration-200 group-open:rotate-45 dark:text-gray-500"
            >
              +
            </span>
          </summary>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{{ faq.a }}</p>
        </details>
      </div>
    </section>

    <!-- 10. Final CTA -->
    <section
      class="reveal mb-14 rounded-xl border border-blue-200 bg-blue-50 px-6 py-10 text-center dark:border-blue-900 dark:bg-blue-950"
    >
      <h2 class="text-2xl font-bold">Your future vocabulary thanks you</h2>
      <p class="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">
        Join 12,400+ learners reviewing smarter, not longer. Free forever, no credit card —
        your first pack is one click away.
      </p>
      <NuxtLink to="/register" class="btn btn-primary mt-5 px-6 py-2.5 text-base">
        Create your free account
      </NuxtLink>
    </section>
  </div>
</template>

<style scoped>
/* 3D flip for the hero demo card */
.flip-scene {
  perspective: 1200px;
}
.flip-inner {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.flip-flipped {
  transform: rotateY(180deg);
}
.flip-face {
  backface-visibility: hidden;
}
.flip-back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}

/* Scroll-reveal: .reveal-hidden is added on mount only to below-fold
   sections, so there's no flash and no-JS visitors see everything. */
.reveal {
  transition:
    opacity 0.6s ease,
    transform 0.6s ease;
}
.reveal-hidden {
  opacity: 0;
  transform: translateY(16px);
}
.reveal-hidden.reveal-visible {
  opacity: 1;
  transform: none;
}
</style>
