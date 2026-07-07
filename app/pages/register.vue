<script setup lang="ts">
definePageMeta({ middleware: "guest" });

const LEVELS = [
  { code: "A1", label: "Beginner" },
  { code: "A2", label: "Elementary" },
  { code: "B1", label: "Intermediate" },
] as const;

const level = ref<string | null>(null);

function pickLevel(code: string) {
  level.value = level.value === code ? null : code;
}
</script>

<template>
  <AuthForm
    title="Create account"
    submit-label="Create account"
    endpoint="/api/auth/register"
    error-fallback="Registration failed"
    new-password
    :extra-body="{ level }"
  >
    <template #fields>
      <fieldset class="mt-1">
        <legend class="mb-1.5 text-sm text-gray-600 dark:text-gray-400">
          Your English level <span class="text-gray-400 dark:text-gray-500">(optional)</span>
        </legend>
        <div class="flex gap-2">
          <button
            v-for="l in LEVELS"
            :key="l.code"
            type="button"
            class="btn flex-1 flex-col gap-0 py-1.5"
            :class="{ 'btn-active': level === l.code }"
            :aria-pressed="level === l.code"
            @click="pickLevel(l.code)"
          >
            <span class="font-bold">{{ l.code }}</span>
            <span class="text-xs font-normal">{{ l.label }}</span>
          </button>
        </div>
        <p class="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          We'll suggest word packs that match your level.
        </p>
      </fieldset>
    </template>
    Already have an account? <NuxtLink to="/login" class="text-blue-600 hover:underline dark:text-blue-400">Log in</NuxtLink>
  </AuthForm>
</template>
