<script setup lang="ts">
const props = withDefaults(defineProps<{
  to?: string
  variant?: 'primary' | 'stamp' | 'outline'
  type?: 'button' | 'submit'
  disabled?: boolean
}>(), { variant: 'primary', type: 'button' })
const cls = computed(() => props.variant === 'outline' ? 'btn2' : props.variant === 'stamp' ? 'btn btn-stamp' : 'btn')
</script>

<template>
  <NuxtLink v-if="to && !disabled" :class="cls" :to="to"><slot /></NuxtLink>
  <button v-else :class="cls" :type="type" :disabled="disabled"><slot /></button>
</template>
