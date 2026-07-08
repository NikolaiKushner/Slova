<script setup lang="ts">
definePageMeta({ middleware: "guest" });

const email = ref("");
const sent = ref(false);
const error = ref("");
const submitting = ref(false);

async function submit() {
  error.value = "";
  submitting.value = true;
  try {
    await $fetch("/api/auth/forgot", { method: "POST", body: { email: email.value } });
    sent.value = true;
  } catch (e) {
    error.value =
      (e as { data?: { statusMessage?: string } })?.data?.statusMessage ||
      "Could not send the reset email — please try again";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="mx-auto mt-16 flex max-w-xs flex-col gap-4">
    <h1 class="text-2xl font-bold">Reset password</h1>

    <template v-if="sent">
      <p class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        If <strong>{{ email }}</strong> is registered, a reset link is on its way. Check your
        inbox — the link is valid for one hour.
      </p>
      <p class="text-sm">
        <NuxtLink to="/login" class="text-blue-600 hover:underline dark:text-blue-400">&larr; Back to log in</NuxtLink>
      </p>
    </template>

    <template v-else>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Enter your account email and we'll send you a link to choose a new password.
      </p>
      <form class="flex flex-col gap-2" @submit.prevent="submit">
        <input v-model="email" class="input" type="email" placeholder="Email" required autocomplete="email" />
        <button type="submit" class="btn btn-primary" :disabled="submitting">Send reset link</button>
      </form>
      <p v-if="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
      <p class="text-sm">
        Remembered it?
        <NuxtLink to="/login" class="text-blue-600 hover:underline dark:text-blue-400">Log in</NuxtLink>
      </p>
    </template>
  </div>
</template>
