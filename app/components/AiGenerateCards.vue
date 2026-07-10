<script setup lang="ts">
// AI card generation panel: describe a topic or paste a text, preview the
// generated cards with checkboxes, and add the ones you keep.
interface GeneratedCard {
  term: string;
  definition: string;
  selected: boolean;
}

const props = defineProps<{ setId: string }>();
const emit = defineEmits<{ added: [] }>();

const open = ref(false);
const mode = ref<"topic" | "text">("topic");
const input = ref("");
const count = ref(12);
const generating = ref(false);
const adding = ref(false);
const error = ref("");
const preview = ref<GeneratedCard[] | null>(null);

const selectedCount = computed(() => preview.value?.filter((card) => card.selected).length ?? 0);

async function generate() {
  if (!input.value.trim() || generating.value) return;
  error.value = "";
  generating.value = true;
  try {
    const result = await $fetch<{ cards: { term: string; definition: string }[] }>(
      "/api/ai/generate",
      {
        method: "POST",
        body: {
          mode: mode.value,
          input: input.value,
          count: count.value,
          setId: Number(props.setId),
        },
      },
    );
    preview.value = result.cards.map((card) => ({ ...card, selected: true }));
    if (!result.cards.length) error.value = "Nothing came back — try rephrasing the input.";
  } catch (e) {
    error.value =
      (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Generation failed";
  } finally {
    generating.value = false;
  }
}

async function addSelected() {
  const cards = preview.value?.filter((card) => card.selected) ?? [];
  if (!cards.length || adding.value) return;
  adding.value = true;
  try {
    for (const card of cards) {
      await $fetch(`/api/sets/${props.setId}/cards`, {
        method: "POST",
        body: { term: card.term, definition: card.definition },
      });
    }
    preview.value = null;
    input.value = "";
    emit("added");
  } finally {
    adding.value = false;
  }
}
</script>

<template>
  <div class="mb-6 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
    <button
      type="button"
      class="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      @click="open = !open"
    >
      <span>✨ Generate cards with AI</span>
      <span class="text-gray-400 dark:text-gray-500">{{ open ? "−" : "+" }}</span>
    </button>

    <div v-if="open" class="border-t border-dashed border-gray-300 px-3 py-3 dark:border-gray-700">
      <template v-if="!preview">
        <div class="mb-2 flex flex-wrap gap-2">
          <button
            type="button"
            class="btn"
            :class="{ 'btn-active': mode === 'topic' }"
            @click="mode = 'topic'"
          >
            From a topic
          </button>
          <button
            type="button"
            class="btn"
            :class="{ 'btn-active': mode === 'text' }"
            @click="mode = 'text'"
          >
            From pasted text
          </button>
          <label class="ml-auto flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            Cards:
            <select v-model.number="count" class="input py-1">
              <option :value="6">6</option>
              <option :value="12">12</option>
              <option :value="20">20</option>
              <option :value="30">30</option>
            </select>
          </label>
        </div>

        <textarea
          v-model="input"
          class="input min-h-20 w-full"
          :placeholder="
            mode === 'topic'
              ? 'Topic, e.g. “ordering food at a restaurant” or “job interviews”'
              : 'Paste an article, song lyrics, or any text — useful vocabulary will be extracted'
          "
        />
        <div class="mt-2 flex items-center gap-3">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="generating || !input.trim()"
            @click="generate"
          >
            {{ generating ? "Generating…" : "✨ Generate" }}
          </button>
          <p v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
        </div>
      </template>

      <template v-else>
        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Untick anything you don't want, then add the rest.
        </p>
        <ul class="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          <li v-for="(card, i) in preview" :key="i">
            <label
              class="flex cursor-pointer items-center gap-2.5 rounded-md border border-gray-200 px-3 py-1.5 dark:border-gray-800"
              :class="{ 'opacity-50': !card.selected }"
            >
              <input v-model="card.selected" type="checkbox" class="accent-blue-600" />
              <span class="font-semibold">{{ card.term }}</span>
              <span class="flex-1 text-sm text-gray-600 dark:text-gray-300">{{ card.definition }}</span>
            </label>
          </li>
        </ul>
        <div class="mt-3 flex gap-2">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="adding || !selectedCount"
            @click="addSelected"
          >
            {{ adding ? "Adding…" : `Add ${selectedCount} ${selectedCount === 1 ? "card" : "cards"}` }}
          </button>
          <button type="button" class="btn" :disabled="adding" @click="preview = null">
            ← Back
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
