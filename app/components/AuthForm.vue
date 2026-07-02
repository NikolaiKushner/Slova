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
  <div class="auth-form">
    <h1>{{ title }}</h1>
    <form @submit.prevent="submit">
      <input v-model="email" type="email" placeholder="Email" required autocomplete="email" />
      <input
        v-model="password"
        type="password"
        :placeholder="newPassword ? 'Password (min 8 characters)' : 'Password'"
        required
        :minlength="newPassword ? 8 : undefined"
        :autocomplete="newPassword ? 'new-password' : 'current-password'"
      />
      <button type="submit" :disabled="submitting">{{ submitLabel }}</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="switch"><slot /></p>
  </div>
</template>

<style scoped>
.auth-form {
  max-width: 320px;
  margin: 4rem auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.auth-form form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
input {
  padding: 0.5rem;
}
.error {
  color: #dc2626;
}
.switch {
  font-size: 0.875rem;
}
</style>
