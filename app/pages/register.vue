<script setup lang="ts">
definePageMeta({ middleware: "guest" });

const { fetch: refreshSession } = useUserSession();

const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: { email: email.value, password: password.value },
    });
    await refreshSession();
    await navigateTo("/");
  } catch (e) {
    error.value = (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Registration failed";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-form">
    <h1>Create account</h1>
    <form @submit.prevent="submit">
      <input v-model="email" type="email" placeholder="Email" required autocomplete="email" />
      <input
        v-model="password"
        type="password"
        placeholder="Password (min 8 characters)"
        required
        minlength="8"
        autocomplete="new-password"
      />
      <button type="submit" :disabled="submitting">Create account</button>
    </form>
    <p v-if="error" class="error">{{ error }}</p>
    <p class="switch">Already have an account? <NuxtLink to="/login">Log in</NuxtLink></p>
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
