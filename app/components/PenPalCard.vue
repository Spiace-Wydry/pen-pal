<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { channelLabel, decline, formatDate, formatShortDay, initial } from '#shared/utils/polish'

const props = defineProps<{ pairing: PairingView }>()
const p = computed(() => props.pairing)
const last = computed(() => p.value.lastLetter)
const state = computed(() =>
  last.value && !last.value.mine && !last.value.readAt ? 'new'
    : last.value?.mine && !last.value.delivered ? 'transit'
      : 'idle')
const pct = computed(() => last.value ? Math.round(100 * last.value.steps.filter(s => s.done).length / last.value.steps.length) : 0)
</script>

<template>
  <NuxtLink :to="`/korespondenci/${p.id}`" class="card" :style="`display: flex; flex-direction: column; gap: 12px${state === 'new' ? '; border: 2px solid #A8432A' : ''}`">
    <div class="row">
      <div class="avatar" aria-hidden="true">{{ initial(p.partner.name) }}</div>
      <div style="flex: 1; min-width: 0">
        <div class="h2" style="font-size: 20px">{{ p.partner.name }}</div>
        <div class="muted">PiszuKod {{ p.palKod }} · {{ channelLabel(p.partner.channel) }}</div>
      </div>
      <AppIcon name="chevron" :stroke-width="2.2" style="color: #5E667A" />
    </div>
    <div v-if="state === 'new'" class="row" style="background: #F3E2DA; border-radius: 10px; padding: 10px 12px; gap: 10px">
      <AppIcon name="mail" style="color: #A8432A" /><span style="font-weight: 700; color: #8C3520">Nowy list! Przyszedł {{ formatDate(last!.deliverAt) }}</span>
    </div>
    <div v-else-if="state === 'transit'" style="display: flex; flex-direction: column; gap: 8px">
      <div class="row" style="justify-content: space-between"><span style="font-size: 15px">Twój list jest w drodze</span><span class="muted">dotrze {{ formatShortDay(last!.deliverAt) }}</span></div>
      <div class="progress"><div class="progress-bar" :style="{ width: `${pct}%`, background: '#1F2A44' }" /></div>
    </div>
    <div v-else class="muted" style="font-size: 17px">
      {{ !last ? 'Napisz pierwszy list' : p.canWrite ? 'Twoja kolej — napisz list' : `Czekasz na list od ${decline(p.partner.name, 'gen')}` }}
    </div>
  </NuxtLink>
</template>
