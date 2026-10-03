<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { initial } from '#shared/utils/polish'
import { topicFor } from '#shared/utils/topics'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p } = await useFetch<PairingView>(`/api/pairings/${id}`)
const { profile, refreshProfile } = useProfile()
if (!profile.value) await refreshProfile()
const topic = computed(() => p.value ? topicFor(p.value.sharedInterests) : null)
const paper = computed(() => p.value?.partner.channel === 'PAPER')
</script>

<template>
  <div v-if="p" class="page">
    <main class="body" style="gap: 22px; padding: 56px 20px 0">
      <div style="display: flex; align-items: center; justify-content: center; gap: 0" aria-hidden="true">
        <div class="avatar" style="width: 88px; height: 88px; border-radius: 44px; font-size: 34px; border: 4px solid #F6F0E4">{{ initial(profile?.name ?? '') }}</div>
        <div class="postmark" style="width: 64px; height: 64px; font-size: 9px; margin: 0 -10px; background: #F6F0E4; z-index: 1">PENPAL</div>
        <div class="avatar" style="width: 88px; height: 88px; border-radius: 44px; font-size: 34px; border: 4px solid #F6F0E4">{{ initial(p.partner.name) }}</div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; text-align: center">
        <h1 class="h1">Masz nowego korespondenta!</h1>
        <p class="p">
          Ty i {{ p.partner.name }} zaczynacie korespondencję.
          <template v-if="paper">{{ p.partner.name }} pisze ręcznie — każdy list zeskanujemy dla Ciebie.</template>
        </p>
      </div>
      <div class="card" style="display: flex; flex-direction: column; gap: 8px; text-align: center; border: 1.5px dashed #A8432A">
        <div class="muted">Wasz PalKod</div>
        <div style="font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 34px; letter-spacing: 0.08em">{{ p.palKod }}</div>
        <p v-if="paper" class="muted">{{ p.partner.name }} wpisuje go na kopercie zamiast adresu. Dzięki niemu list trafi do Ciebie.</p>
      </div>
      <InfoNote v-if="topic" icon="bulb">Na początek: {{ topic.prompt }}. Oboje lubicie <b>{{ topic.interest }}</b>.</InfoNote>
    </main>
    <div class="foot">
      <AppButton variant="stamp" :to="`/korespondenci/${id}/napisz`">Napisz pierwszy list</AppButton>
      <AppButton variant="outline" to="/listy">Przejdź do moich listów</AppButton>
    </div>
  </div>
</template>
