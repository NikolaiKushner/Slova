<script setup lang="ts">
// Apply the saved (or OS-preferred) theme before hydration to avoid a flash
// of the wrong background.
useHead({
  script: [
    {
      innerHTML:
        "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()",
      tagPosition: "head",
    },
  ],
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
