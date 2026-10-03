<script setup lang="ts">
import type { LetterView, PairingView } from '#shared/types/api'
import { channelLabel, decline, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const [{ data: p, error }, { data: letters }] = await Promise.all([
  useFetch<PairingView>(`/api/pairings/${id}`),
  useFetch<LetterView[]>(`/api/pairings/${id}/letters`),
])
// Blocked/ended pairings are still fetchable by id; they have no timeline to show.
if (p.value && p.value.status !== 'ACTIVE' && p.value.status !== 'INVITED') await navigateTo('/listy', { replace: true })
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop back="/listy" :title="p.partner.name" :subtitle="`PalKod ${p.palKod} · ${channelLabel(p.partner.channel)}`">
      <template #lead><div class="avatar" aria-hidden="true" style="width: 44px; height: 44px; font-size: 18px">{{ initial(p.partner.name) }}</div></template>
      <NuxtLink class="back" :to="`/korespondenci/${id}/zglos`" aria-label="Więcej opcji"><AppIcon name="more" /></NuxtLink>
    </ScreenTop>
    <main class="body" style="gap: 12px; padding-top: 12px">
      <LetterCard v-for="l in letters ?? []" :key="l.id" :letter="l" :partner-name="p.partner.name" />
      <div style="flex: 1" />
      <NuxtLink v-if="p.canWrite" :to="`/korespondenci/${id}/zdjecie`" class="note" style="text-decoration: none">
        <AppIcon name="camera" /><span>Wolisz napisać ręcznie? <b>Dodaj zdjęcie swojego listu</b></span>
      </NuxtLink>
    </main>
    <div class="foot">
      <AppButton v-if="p.canWrite" variant="stamp" :to="`/korespondenci/${id}/napisz`">
        {{ letters?.length ? `Odpisz ${decline(p.partner.name, 'dat')}` : 'Napisz pierwszy list' }}
      </AppButton>
      <p v-else class="muted" style="text-align: center">Odpiszesz, gdy przyjdzie list od {{ decline(p.partner.name, 'gen') }}.</p>
    </div>
  </div>
  <p v-else-if="error" class="error" role="alert" style="padding: 20px">{{ errorText(error) }}</p>
</template>
