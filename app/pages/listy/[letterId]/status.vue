<script setup lang="ts">
import type { LetterResponse } from '#shared/types/api'
import { decline, onDay } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const letterId = useRoute().params.letterId as string
const { data } = await useFetch<LetterResponse>(`/api/letters/${letterId}`)
if (data.value && !data.value.letter.mine) await navigateTo(`/listy/${letterId}`, { replace: true })
const l = computed(() => data.value?.letter)
const name = computed(() => data.value?.pairing.partner.name ?? '')
</script>

<template>
  <div v-if="l" class="page">
    <ScreenTop back="/listy" back-icon="close" back-label="Zamknij" title="Status listu" />
    <main class="body" style="gap: 24px">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding-top: 8px">
        <div class="postmark" style="width: 104px; height: 104px; font-size: 12px" aria-hidden="true">
          <template v-if="l.delivered">DOSTARCZONY</template>
          <template v-else>W DRODZE<br>DO {{ decline(name, 'gen').toUpperCase() }}</template>
        </div>
        <h1 class="h1">{{ l.delivered ? 'Twój list dotarł' : 'Twój list jest w drodze' }}</h1>
        <p class="p">{{ l.delivered ? `List dotarł ${onDay(l.deliverAt)}.` : `${name} dostanie go ${onDay(l.deliverAt)}.` }}</p>
      </div>
      <DeliveryTimeline :steps="l.steps" />
      <a v-if="l.deliveryChannel === 'PAPER'" :href="`/api/letters/${l.id}/pdf`" target="_blank" rel="noopener" style="font-size: 17px; min-height: 48px; display: inline-flex; align-items: center">Zobacz wydruk (PDF)</a>
    </main>
    <div class="foot">
      <AppButton to="/listy">Wróć do moich listów</AppButton>
    </div>
  </div>
</template>
