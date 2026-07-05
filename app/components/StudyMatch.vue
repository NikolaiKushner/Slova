<script setup lang="ts">
import type { Rating, StudyCard } from "~/components/StudySession.vue";

const props = defineProps<{ cards: StudyCard[] }>();
const emit = defineEmits<{ answered: [card: StudyCard, rating: Rating]; next: [] }>();

// Six pairs (twelve tiles) per round keeps the grid scannable.
const PAIRS_PER_ROUND = 6;

interface Tile {
  key: string;
  cardId: number;
  text: string;
}

const rounds: StudyCard[][] = [];
for (let i = 0; i < props.cards.length; i += PAIRS_PER_ROUND) {
  rounds.push(props.cards.slice(i, i + PAIRS_PER_ROUND));
}

const roundIndex = ref(0);
const tiles = ref<Tile[]>([]);
const matched = ref(new Set<number>());
const selected = ref<Tile | null>(null);
// Keys of the two tiles from the last wrong guess, cleared after a beat.
const wrongPair = ref<string[]>([]);
// Wrong guesses per card within the session decide its rating.
const misses = new Map<number, number>();

function buildRound() {
  tiles.value = shuffle(
    rounds[roundIndex.value]!.flatMap((card) => [
      { key: `${card.id}-term`, cardId: card.id, text: card.term },
      { key: `${card.id}-definition`, cardId: card.id, text: card.definition },
    ]),
  );
  matched.value = new Set();
  selected.value = null;
}
buildRound();

function ratingFor(missCount: number): Rating {
  if (missCount === 0) return "good";
  if (missCount === 1) return "hard";
  return "again";
}

function pick(tile: Tile) {
  if (matched.value.has(tile.cardId) || wrongPair.value.length) return;
  if (!selected.value) {
    selected.value = tile;
    return;
  }
  if (selected.value.key === tile.key) {
    selected.value = null;
    return;
  }

  const first = selected.value;
  selected.value = null;

  if (first.cardId === tile.cardId) {
    matched.value = new Set([...matched.value, tile.cardId]);
    const card = props.cards.find((c) => c.id === tile.cardId)!;
    emit("answered", card, ratingFor(misses.get(tile.cardId) ?? 0));
    if (matched.value.size === rounds[roundIndex.value]!.length) {
      setTimeout(() => {
        if (roundIndex.value + 1 < rounds.length) {
          roundIndex.value += 1;
          buildRound();
        } else {
          emit("next");
        }
      }, 600);
    }
  } else {
    misses.set(first.cardId, (misses.get(first.cardId) ?? 0) + 1);
    misses.set(tile.cardId, (misses.get(tile.cardId) ?? 0) + 1);
    wrongPair.value = [first.key, tile.key];
    setTimeout(() => {
      wrongPair.value = [];
    }, 500);
  }
}

function tileClass(tile: Tile) {
  if (matched.value.has(tile.cardId))
    return "invisible";
  if (wrongPair.value.includes(tile.key))
    return "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
  if (selected.value?.key === tile.key)
    return "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  return "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800";
}
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>Match each term with its definition</span>
      <span v-if="rounds.length > 1">Round {{ roundIndex + 1 }} / {{ rounds.length }}</span>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button
        v-for="tile in tiles"
        :key="tile.key"
        type="button"
        class="min-h-20 cursor-pointer rounded-lg border p-3 text-center text-sm break-words transition-colors"
        :class="tileClass(tile)"
        @click="pick(tile)"
      >
        {{ tile.text }}
      </button>
    </div>
  </div>
</template>
