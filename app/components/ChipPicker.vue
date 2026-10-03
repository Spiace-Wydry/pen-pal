<script setup lang="ts">
const props = defineProps<{
  options: readonly string[]
  labels?: (v: string) => string
  multiple?: boolean
  max?: number
  label: string
  /** Equal-width chips in a 2-column grid instead of wrapping by text length. */
  grid?: boolean
}>()
const model = defineModel<string | string[]>({ required: true })

const isOn = (v: string) => props.multiple ? (model.value as string[]).includes(v) : model.value === v
function toggle(v: string) {
  if (!props.multiple) { model.value = v; return }
  const cur = model.value as string[]
  if (cur.includes(v)) model.value = cur.filter(x => x !== v)
  else if (!props.max || cur.length < props.max) model.value = [...cur, v]
}
</script>

<template>
  <div class="chips" :class="{ 'chips-grid': grid }" role="group" :aria-label="label">
    <button
      v-for="o in options" :key="o" type="button" class="chip" :class="{ 'chip-on': isOn(o) }"
      :aria-pressed="isOn(o)" @click="toggle(o)"
    >
      {{ labels ? labels(o) : o }}
    </button>
  </div>
</template>

<style scoped>
.chips-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.chips-grid .chip { justify-content: center; text-align: center; }
</style>
