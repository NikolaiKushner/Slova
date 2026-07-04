<script setup lang="ts">
const props = defineProps<{
  title: string;
  submitLabel: string;
  endpoint: string;
  errorFallback: string;
  newPassword?: boolean;
}>();

const { fetch: refreshSession } = useUserSession();

const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    await $fetch(props.endpoint, {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    await refreshSession();
    await navigateTo("/");
  } catch (e) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || props.errorFallback;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto mt-16 flex max-w-xs flex-col gap-4">
    <h1 class="text-2xl font-bold">{{ title }}</h1>
    <form class="flex flex-col gap-2" @submit.prevent="submit">
      <input v-model="email" class="input" type="email" placeholder="Email" required autocomplete="email" />
      <input
        v-model="password"
        class="input"
        type="password"
        :placeholder="newPassword ? 'Password (min 8 characters)' : 'Password'"
        required
        :minlength="newPassword ? 8 : undefined"
        :autocomplete="newPassword ? 'new-password' : 'current-password'"
      />
      <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitLabel }}</button>
    </form>
    <p v-if="error" class="text-red-600">{{ error }}</p>
    <p class="text-sm"><slot /></p>
  </div>
</template>
