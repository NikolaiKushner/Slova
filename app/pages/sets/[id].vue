<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface Card {
  id: number;
  term: string;
  definition: string;
  position: number;
}

interface QuizSet {
  id: number;
  title: string;
  description: string | null;
  cards: Card[];
}

const route = useRoute();
const setId = route.params.id as string;

const { data: set, refresh } = await useFetch<QuizSet>(`/api/sets/${setId}`);

const term = ref("");
const definition = ref("");
const addingCard = ref(false);

async function addCard() {
  if (!term.value.trim() || !definition.value.trim()) return;
  addingCard.value = true;
  try {
    await $fetch(`/api/sets/${setId}/cards`, {
      method: "POST",
      body: { term: term.value, definition: definition.value },
    });
    term.value = "";
    definition.value = "";
    await refresh();
  } finally {
    addingCard.value = false;
  }
}

async function removeCard(id: number) {
  await $fetch(`/api/cards/${id}`, { method: "DELETE" });
  await refresh();
}

const mode = ref<"edit" | "study">("edit");
const studyIndex = ref(0);
const flipped = ref(false);

const studyCard = computed(() => set.value?.cards[studyIndex.value]);

function next() {
  if (!set.value?.cards.length) return;
  flipped.value = false;
  studyIndex.value = (studyIndex.value + 1) % set.value.cards.length;
}

function prev() {
  if (!set.value?.cards.length) return;
  flipped.value = false;
  studyIndex.value = (studyIndex.value - 1 + set.value.cards.length) % set.value.cards.length;
}

function startStudy() {
  studyIndex.value = 0;
  flipped.value = false;
  mode.value = "study";
}
</script>

<template>
  <div v-if="set">
    <NuxtLink to="/">&larr; My sets</NuxtLink>
    <h1>{{ set.title }}</h1>
    <p v-if="set.description" class="description">{{ set.description }}</p>

    <div class="mode-switch">
      <button type="button" :class="{ active: mode === 'edit' }" @click="mode = 'edit'">Edit</button>
      <button
        type="button"
        :class="{ active: mode === 'study' }"
        :disabled="!set.cards.length"
        @click="startStudy"
      >
        Study
      </button>
    </div>

    <template v-if="mode === 'edit'">
      <form class="new-card" @submit.prevent="addCard">
        <input v-model="term" placeholder="Term" required />
        <input v-model="definition" placeholder="Definition" required />
        <button type="submit" :disabled="addingCard">Add card</button>
      </form>

      <ul class="cards">
        <li v-for="card in set.cards" :key="card.id">
          <span class="term">{{ card.term }}</span>
          <span class="definition">{{ card.definition }}</span>
          <button type="button" @click="removeCard(card.id)">Delete</button>
        </li>
        <li v-if="!set.cards.length" class="empty">No cards yet — add one above.</li>
      </ul>
    </template>

    <template v-else-if="studyCard">
      <div class="flashcard" @click="flipped = !flipped">
        <p>{{ flipped ? studyCard.definition : studyCard.term }}</p>
        <span class="hint">Click to flip</span>
      </div>
      <div class="study-nav">
        <button type="button" @click="prev">&larr; Prev</button>
        <span>{{ studyIndex + 1 }} / {{ set.cards.length }}</span>
        <button type="button" @click="next">Next &rarr;</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.description {
  color: #6b7280;
}
.mode-switch {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}
.mode-switch button.active {
  font-weight: 700;
}
.new-card {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.new-card input {
  flex: 1;
  padding: 0.4rem 0.6rem;
}
.cards {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cards li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.term {
  font-weight: 600;
}
.definition {
  color: #4b5563;
  flex: 1;
  margin: 0 1rem;
}
.empty {
  color: #9ca3af;
  border: none;
  justify-content: center;
}
.flashcard {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 4rem 1rem;
  text-align: center;
  font-size: 1.5rem;
  cursor: pointer;
  user-select: none;
}
.flashcard .hint {
  display: block;
  margin-top: 1rem;
  font-size: 0.75rem;
  color: #9ca3af;
}
.study-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}
</style>
