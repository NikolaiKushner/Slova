<script setup lang="ts">
const props = defineProps<{ setId: string | number }>();
const emit = defineEmits<{ imported: [] }>();

const open = ref(false);
const text = ref("");
const importing = ref(false);
const message = ref("");

interface ParsedCard {
  term: string;
  definition: string;
}

// One card per line. The separator is whatever comes first: tab, semicolon,
// comma, or " - ". Quotes around CSV fields are stripped.
function parseLine(line: string): ParsedCard | null {
  const separators = ["\t", ";", ",", " - ", " – "];
  let splitAt = -1;
  let sepLength = 0;
  for (const sep of separators) {
    const idx = line.indexOf(sep);
    if (idx > 0 && (splitAt === -1 || idx < splitAt)) {
      splitAt = idx;
      sepLength = sep.length;
    }
  }
  if (splitAt === -1) return null;
  const unquote = (value: string) => value.trim().replace(/^"(.*)"$/s, "$1").trim();
  const term = unquote(line.slice(0, splitAt));
  const definition = unquote(line.slice(splitAt + sepLength));
  if (!term || !definition) return null;
  return { term, definition };
}

const parsed = computed(() => {
  const lines = text.value.split("\n").map((line) => line.trim()).filter(Boolean);
  const cards: ParsedCard[] = [];
  let skipped = 0;
  for (const line of lines) {
    const card = parseLine(line);
    if (card) cards.push(card);
    else skipped += 1;
  }
  return { cards, skipped };
});

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  text.value = await file.text();
  (event.target as HTMLInputElement).value = "";
}

async function runImport() {
  if (!parsed.value.cards.length || importing.value) return;
  importing.value = true;
  message.value = "";
  try {
    const result = await $fetch<{ imported: number }>(`/api/sets/${props.setId}/cards/import`, {
      method: "POST",
      body: { cards: parsed.value.cards },
    });
    message.value = `Imported ${result.imported} cards.`;
    text.value = "";
    emit("imported");
  } catch (e) {
    message.value =
      (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Import failed";
  } finally {
    importing.value = false;
  }
}
</script>

<template>
  <div class="mb-6 rounded-lg border border-gray-200 dark:border-gray-800">
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300"
      @click="open = !open"
    >
      <span>📥 Import words (CSV or text)</span>
      <span class="text-gray-400">{{ open ? "▴" : "▾" }}</span>
    </button>

    <div v-if="open" class="border-t border-gray-200 p-3 dark:border-gray-800">
      <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
        One word per line: <code class="rounded bg-gray-100 px-1 dark:bg-gray-800">term, translation</code> —
        commas, semicolons, tabs or " - " all work.
      </p>
      <textarea
        v-model="text"
        rows="6"
        class="input w-full font-mono text-xs"
        placeholder="apple, яблоко&#10;dog; собака&#10;run - бежать"
      />
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!parsed.cards.length || importing"
          @click="runImport"
        >
          Import {{ parsed.cards.length || "" }} {{ parsed.cards.length === 1 ? "card" : "cards" }}
        </button>
        <label class="btn">
          Upload .csv / .txt
          <input type="file" accept=".csv,.txt,text/csv,text/plain" class="hidden" @change="onFile" />
        </label>
        <span v-if="parsed.skipped" class="text-xs text-amber-600 dark:text-amber-400">
          {{ parsed.skipped }} line(s) skipped — no separator found
        </span>
        <span v-if="message" class="text-xs text-gray-500 dark:text-gray-400">{{ message }}</span>
      </div>
    </div>
  </div>
</template>
