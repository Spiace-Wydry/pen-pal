<script setup lang="ts">
import type { TimelineStep } from '#shared/utils/letters'
import { formatLongDay, formatStepTime } from '#shared/utils/polish'

const props = defineProps<{ steps: TimelineStep[] }>()
const current = computed(() => props.steps.findIndex(s => !s.done))
</script>

<template>
  <ol class="card" style="display: flex; flex-direction: column; gap: 0; padding: 20px; margin: 0; list-style: none">
    <li v-for="(s, i) in steps" :key="s.label" style="display: flex; gap: 14px" :aria-current="i === current ? 'step' : undefined">
      <div style="display: flex; flex-direction: column; align-items: center" aria-hidden="true">
        <div v-if="s.done" style="width: 26px; height: 26px; border-radius: 13px; background: #1F2A44; display: flex; align-items: center; justify-content: center; color: #FFFDF8">
          <AppIcon name="check" :size="16" :stroke-width="3.5" />
        </div>
        <div v-else-if="i === current" style="width: 26px; height: 26px; border-radius: 13px; border: 3px solid #A8432A; background: #FFFDF8" />
        <div v-else style="width: 26px; height: 26px; border-radius: 13px; border: 2px solid #CDBF9F" />
        <div v-if="i < steps.length - 1" :style="{ width: '2px', height: '36px', background: s.done ? '#1F2A44' : '#D9CDB5' }" />
      </div>
      <div>
        <div :style="{ fontWeight: s.done || i === current ? 700 : 400, fontSize: '17px', color: i === current ? '#8C3520' : undefined }">{{ s.label }}</div>
        <div class="muted">{{ s.done ? formatStepTime(s.at) : formatLongDay(s.at) }}</div>
      </div>
    </li>
  </ol>
</template>
