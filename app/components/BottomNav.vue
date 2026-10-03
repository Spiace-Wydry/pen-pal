<script setup lang="ts">
const route = useRoute()
const items = [
  { to: '/listy', label: 'Listy', icon: 'mail' },
  { to: '/mapa', label: 'Mapa', icon: 'pin' },
  { to: '/profil', label: 'Profil', icon: 'user' },
]
</script>

<template>
  <nav class="nav" aria-label="Nawigacja">
    <NuxtLink
      v-for="i in items" :key="i.to" :to="i.to" class="nav-a"
      :class="{ 'nav-on': route.path === i.to }" :aria-current="route.path === i.to ? 'page' : undefined"
    >
      <AppIcon :name="i.icon" :size="26" />{{ i.label }}
    </NuxtLink>
  </nav>
</template>
