<script setup lang="ts">
definePageMeta({ middleware: "guest" });

const route = useRoute();
const token = computed(() => (typeof route.query.token === "string" ? route.query.token : ""));

const { fetch: refreshSession } = useUserSession();

const password = ref("");
const error = ref("");
const submitting = ref(false);

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    await $fetch("/api/auth/reset", {
      method: "POST",
      body: { token: token.value, password: password.value },
    });
    await refreshSession();
    await navigateTo("/dashboard");
  } catch (e) {
    error.value =
      (e as { data?: { statusMessage?: string } })?.data?.statusMessage || "Password reset failed";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto mt-16 flex max-w-xs flex-col gap-4">
    <h1 class="text-2xl font-bold">Choose a new password</h1>

    <template v-if="!token">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        This page needs the link from your reset email. If yours has expired,
        request a fresh one.
      </p>
      <NuxtLink to="/forgot-password" class="btn btn-primary text-center">Request reset link</NuxtLink>
    </template>

    <template v-else>
      <form class="flex flex-col gap-2" @submit.prevent="submit">
        <input
          v-model="password"
          class="input"
          type="password"
          placeholder="New password (min 8 characters)"
          required
          minlength="8"
          autocomplete="new-password"
        />
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          Set new password
        </button>
      </form>
      <p v-if="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        You'll be logged in right after.
      </p>
    </template>
  </div>
</template>
