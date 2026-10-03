<script setup lang="ts">
withDefaults(defineProps<{
  back?: string
  backLabel?: string
  backIcon?: 'back' | 'close'
  title?: string
  subtitle?: string
}>(), { backLabel: 'Wstecz', backIcon: 'back' })
</script>

<template>
  <header class="top">
    <NuxtLink v-if="back" class="back" :to="back" :aria-label="backLabel">
      <AppIcon :name="backIcon" :stroke-width="2.2" />
    </NuxtLink>
    <slot name="lead" />
    <div style="flex: 1; min-width: 0">
      <div v-if="title" class="top-title">{{ title }}</div>
      <div v-if="subtitle" class="muted" style="font-size: 14px">{{ subtitle }}</div>
      <slot name="center" />
    </div>
    <slot />
  </header>
</template>
