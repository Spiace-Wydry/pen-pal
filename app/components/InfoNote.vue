<script setup lang="ts">
withDefaults(defineProps<{ icon?: string, alert?: boolean }>(), { icon: 'info' })
</script>

<template>
  <div class="note" :role="alert ? 'alert' : 'note'">
    <AppIcon :name="icon" :size="22" />
    <span><slot /></span>
  </div>
</template>
