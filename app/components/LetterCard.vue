<script setup lang="ts">
import type { LetterView } from '#shared/types/api'
import { decline, formatDate } from '#shared/utils/polish'

const props = defineProps<{ letter: LetterView, partnerName: string }>()
const l = computed(() => props.letter)
const fresh = computed(() => !l.value.mine && !l.value.readAt)
const title = computed(() => l.value.mine ? 'Twój list' : `List od ${decline(props.partnerName, 'gen')}`)
const sub = computed(() => l.value.mine
  ? `${formatDate(l.value.sentAt)} · ${!l.value.delivered ? 'w drodze' : l.value.deliveryChannel === 'PAPER' ? 'dostarczony pocztą' : 'dostarczony w aplikacji'}`
  : `${formatDate(l.value.deliverAt)} · ${l.value.readAt ? 'przeczytany' : l.value.kind === 'SCAN' ? 'zeskanowany w PalPoincie' : 'napisany w aplikacji'}`)
const style = computed(() => `display: flex; gap: 14px; align-items: center${l.value.mine ? '; margin-left: 32px; background: #EFE4CF; border-color: #E3D8C3' : fresh.value ? '; border: 2px solid #A8432A' : ''}`)
</script>

<template>
  <NuxtLink :to="l.mine ? `/listy/${l.id}/status` : `/listy/${l.id}`" class="card" :style="style">
    <svg v-if="l.kind === 'SCAN'" width="44" height="56" viewBox="0 0 64 80" fill="none" style="flex: none" aria-hidden="true"><rect x="1" y="1" width="62" height="78" rx="3" fill="#FFFDF8" stroke="#CDBF9F" /><path d="M9 16c6-3 10 2 16-1s10 1 15-1 8 1 14 0M9 28c5-2 11 2 17 0s9 1 14-1 7 1 12 0M9 40c6-3 10 2 16-1s10 1 15-1M9 52c5-2 11 2 17 0s9 1 14-1 7 1 12 0M9 64c6-2 9 1 14 0" stroke="#3B4560" stroke-width="1.4" stroke-linecap="round" /></svg>
    <AppIcon v-else-if="!l.mine" name="mail" :size="32" style="color: #A8432A" />
    <div style="flex: 1; display: flex; flex-direction: column; gap: 4px">
      <div class="row" style="gap: 8px">
        <span style="font-weight: 700; font-size: 17px">{{ title }}</span>
        <span v-if="fresh" class="tag" style="background: #A8432A; color: #FFFDF8; min-height: 24px; font-size: 12px; font-weight: 700">NOWY</span>
      </div>
      <div class="muted">{{ sub }}</div>
    </div>
    <AppIcon v-if="l.mine && l.delivered" name="check" :size="24" :stroke-width="2.4" style="color: #2F6B45" />
  </NuxtLink>
</template>
