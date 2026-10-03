<script setup lang="ts">
defineProps<{ value: string, name: string }>()
const model = defineModel<string>()
</script>

<template>
  <label class="radio" :class="{ 'radio-on': model === value }">
    <input v-model="model" class="sr-only" type="radio" :name="name" :value="value">
    <span class="ring" :class="{ 'ring-on': model === value }" />
    <span style="flex: 1; min-width: 0"><slot /></span>
  </label>
</template>
