<script setup lang="ts">
definePageMeta({ middleware: "guest" });
</script>

<template>
  <AuthForm title="Log in" submit-label="Log in" endpoint="/api/auth/login" error-fallback="Login failed">
    No account? <NuxtLink to="/register" class="text-blue-600 hover:underline dark:text-blue-400">Register</NuxtLink>
    <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
    <NuxtLink to="/forgot-password" class="text-blue-600 hover:underline dark:text-blue-400">Forgot password?</NuxtLink>
  </AuthForm>
</template>
