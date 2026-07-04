<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface QuizSet {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
  cardCount: number;
  learnedCount: number;
  dueCount: number;
}

interface Stats {
  streak: number;
  reviewsToday: number;
  dueTotal: number;
}

const { data: sets, refresh } = await useFetch<QuizSet[]>("/api/sets");
const { data: stats } = await useFetch<Stats>("/api/stats");

const title = ref("");
const description = ref("");
const creating = ref(false);

async function createSet() {
  if (!title.value.trim()) return;
  creating.value = true;
  try {
    await $fetch("/api/sets", {
      method: "POST",
      body: { title: title.value, description: description.value },
    });
    title.value = "";
    description.value = "";
    await refresh();
  } finally {
    creating.value = false;
  }
}

async function removeSet(id: number) {
  await $fetch(`/api/sets/${id}`, { method: "DELETE" });
  await refresh();
}
</script>

<template>
  <div>
    <h1>My sets</h1>

    <div v-if="stats && (stats.streak || stats.reviewsToday || stats.dueTotal)" class="stats">
      <span v-if="stats.streak" class="streak">🔥 {{ stats.streak }}-day streak</span>
      <span>{{ stats.reviewsToday }} reviews today</span>
      <span v-if="stats.dueTotal" class="due">{{ stats.dueTotal }} cards due</span>
      <span v-else class="caught-up">all caught up ✓</span>
    </div>

    <form class="new-set" @submit.prevent="createSet">
      <input v-model="title" placeholder="Set title" required />
      <input v-model="description" placeholder="Description (optional)" />
      <button type="submit" :disabled="creating">Create</button>
    </form>

    <ul class="sets">
      <li v-for="set in sets" :key="set.id">
        <NuxtLink :to="`/sets/${set.id}`">{{ set.title }}</NuxtLink>
        <span v-if="set.description" class="description">{{ set.description }}</span>
        <span v-if="set.cardCount" class="meta">{{ set.learnedCount }}/{{ set.cardCount }} learned</span>
        <span v-if="set.dueCount" class="due-badge">{{ set.dueCount }} due</span>
        <span v-else-if="set.cardCount" class="done-badge">✓ done for now</span>
        <button type="button" @click="removeSet(set.id)">Delete</button>
      </li>
      <li v-if="!sets?.length" class="empty">No sets yet — create one above.</li>
    </ul>
  </div>
</template>

<style scoped>
.new-set {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.new-set input {
  flex: 1;
  padding: 0.4rem 0.6rem;
}
.sets {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sets li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.description {
  color: #6b7280;
  font-size: 0.875rem;
  flex: 1;
}
.empty {
  color: #9ca3af;
  border: none;
  justify-content: center;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  padding: 0.6rem 1rem;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  font-size: 0.875rem;
  color: #4b5563;
}
.stats .streak {
  font-weight: 600;
}
.stats .due {
  color: #1d4ed8;
}
.stats .caught-up {
  color: #16a34a;
}
.meta {
  color: #9ca3af;
  font-size: 0.75rem;
  white-space: nowrap;
}
.due-badge {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 0.1rem 0.6rem;
  font-size: 0.75rem;
  white-space: nowrap;
}
.done-badge {
  color: #16a34a;
  font-size: 0.75rem;
  white-space: nowrap;
}
</style>
