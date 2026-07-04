<script setup lang="ts">
definePageMeta({ middleware: "guest" });
</script>

<template>
  <AuthForm title="Log in" submit-label="Log in" endpoint="/api/auth/login" error-fallback="Login failed">
    No account? <NuxtLink to="/register" class="text-blue-600 hover:underline dark:text-blue-400">Register</NuxtLink>
  </AuthForm>
</template>
