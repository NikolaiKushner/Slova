<script setup lang="ts">
definePageMeta({ middleware: "guest" });
</script>

<template>
  <AuthForm
    title="Create account"
    submit-label="Create account"
    endpoint="/api/auth/register"
    error-fallback="Registration failed"
    new-password
  >
    Already have an account? <NuxtLink to="/login">Log in</NuxtLink>
  </AuthForm>
</template>
