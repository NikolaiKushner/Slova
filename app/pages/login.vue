<script setup lang="ts">
definePageMeta({ middleware: "guest" });
</script>

<template>
  <AuthForm title="Log in" submit-label="Log in" endpoint="/api/auth/login" error-fallback="Login failed">
    No account? <NuxtLink to="/register">Register</NuxtLink>
  </AuthForm>
</template>
