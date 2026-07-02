<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface QuizSet {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
}

const { data: sets, refresh } = await useFetch<QuizSet[]>("/api/sets");

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

    <form class="new-set" @submit.prevent="createSet">
      <input v-model="title" placeholder="Set title" required />
      <input v-model="description" placeholder="Description (optional)" />
      <button type="submit" :disabled="creating">Create</button>
    </form>

    <ul class="sets">
      <li v-for="set in sets" :key="set.id">
        <NuxtLink :to="`/sets/${set.id}`">{{ set.title }}</NuxtLink>
        <span v-if="set.description" class="description">{{ set.description }}</span>
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
</style>
