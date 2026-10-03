<script setup lang="ts">
const props = defineProps<{ step: number }>()
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 6px">
    <div class="muted">Krok {{ props.step }} z 4</div>
    <div class="progress" role="progressbar" :aria-valuenow="props.step" aria-valuemin="1" aria-valuemax="4">
      <div class="progress-bar" :style="{ width: `${props.step * 25}%` }" />
    </div>
  </div>
</template>
