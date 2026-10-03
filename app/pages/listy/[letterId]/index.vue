<script setup lang="ts">
import type { LetterResponse } from '#shared/types/api'
import { decline, formatDate, plural } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const letterId = useRoute().params.letterId as string
const { data, error } = await useFetch<LetterResponse>(`/api/letters/${letterId}`)
const zoom = ref(100)
const l = computed(() => data.value?.letter)
const name = computed(() => data.value?.pairing.partner.name ?? '')
const title = computed(() => l.value?.mine ? 'Twój list' : `List od ${decline(name.value, 'gen')}`)
const subtitle = computed(() => {
  if (!l.value) return ''
  const date = formatDate(l.value.mine ? l.value.sentAt : l.value.deliverAt)
  const n = l.value.imageUrls.length
  return l.value.kind === 'SCAN' ? `${date} · ${n} ${plural(n, 'strona', 'strony', 'stron')}` : date
})
</script>

<template>
  <div class="page">
    <ScreenTop :back="l ? `/korespondenci/${l.pairingId}` : '/listy'" :title="title" :subtitle="subtitle" />
    <main v-if="l" class="body" style="gap: 14px; padding-top: 8px">
      <div v-if="l.kind === 'SCAN'" style="overflow: auto; display: flex; flex-direction: column; gap: 12px">
        <img
          v-for="(src, i) in l.imageUrls" :key="src" :src="src" :alt="`Strona ${i + 1} listu`"
          :style="{ width: `${zoom}%`, maxWidth: 'none', borderRadius: '6px', border: '1px solid #E3D8C3' }"
        >
      </div>
      <div v-else class="paper" :style="{ whiteSpace: 'pre-wrap', padding: '20px 22px', fontFamily: `'Caveat', cursive`, color: '#22305A', fontSize: `${25 * zoom / 100}px`, lineHeight: `${32 * zoom / 100}px` }">{{ l.body }}</div>
      <div class="row" style="justify-content: center; gap: 12px">
        <button class="back" type="button" aria-label="Pomniejsz" style="cursor: pointer" :disabled="zoom <= 75" @click="zoom -= 25"><AppIcon name="minus" :stroke-width="2.2" /></button>
        <span class="muted" aria-live="polite" style="font-weight: 700; min-width: 60px; text-align: center">{{ zoom }}%</span>
        <button class="back" type="button" aria-label="Powiększ" style="cursor: pointer" :disabled="zoom >= 200" @click="zoom += 25"><AppIcon name="plus" :stroke-width="2.2" /></button>
      </div>
    </main>
    <p v-else-if="error" class="error" role="alert" style="padding: 20px">{{ errorText(error) }}</p>
    <div v-if="l && !l.mine && data?.pairing.canWrite" class="foot" style="padding-top: 0">
      <AppButton variant="stamp" :to="`/korespondenci/${l.pairingId}/napisz`">Odpisz</AppButton>
    </div>
  </div>
</template>
