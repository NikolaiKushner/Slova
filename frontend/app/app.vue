<script setup lang="ts">
interface Item {
  id: number
  name: string
  description: string | null
}

const config = useRuntimeConfig()
const apiBase = config.public.apiBase

const { data: health } = await useFetch<{ status: string }>(`${apiBase}/api/health`)
const { data: items, refresh } = await useFetch<Item[]>(`${apiBase}/api/items`)

const form = reactive({ name: '', description: '' })
const submitting = ref(false)

async function addItem() {
  if (!form.name.trim()) return
  submitting.value = true
  try {
    await $fetch(`${apiBase}/api/items`, {
      method: 'POST',
      body: { name: form.name, description: form.description || null },
    })
    form.name = ''
    form.description = ''
    await refresh()
  } finally {
    submitting.value = false
  }
}

async function removeItem(id: number) {
  await $fetch(`${apiBase}/api/items/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="page">
    <NuxtRouteAnnouncer />

    <header>
      <h1>FastAPI + Nuxt Template</h1>
      <p class="status">
        Backend status:
        <strong :class="health?.status === 'ok' ? 'ok' : 'down'">
          {{ health?.status ?? 'unreachable' }}
        </strong>
      </p>
    </header>

    <form class="add-item" @submit.prevent="addItem">
      <input v-model="form.name" placeholder="Item name" required />
      <input v-model="form.description" placeholder="Description (optional)" />
      <button type="submit" :disabled="submitting">Add</button>
    </form>

    <ul class="items">
      <li v-for="item in items" :key="item.id">
        <span>{{ item.name }}</span>
        <span v-if="item.description" class="description">{{ item.description }}</span>
        <button type="button" @click="removeItem(item.id)">Delete</button>
      </li>
      <li v-if="!items?.length" class="empty">No items yet — add one above.</li>
    </ul>
  </div>
</template>

<style scoped>
.page {
  max-width: 480px;
  margin: 4rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
}
.status .ok {
  color: #16a34a;
}
.status .down {
  color: #dc2626;
}
.add-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.add-item input {
  flex: 1;
  padding: 0.4rem 0.6rem;
}
.items {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.items li {
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
}
.empty {
  color: #9ca3af;
  border: none;
  justify-content: center;
}
</style>
