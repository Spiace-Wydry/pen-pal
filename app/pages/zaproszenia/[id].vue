<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { ageLabel, channelLabel, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p, error: loadError } = await useFetch<PairingView>(`/api/pairings/${id}`)
const error = ref('')
const busy = ref(false)

async function act(action: 'accept' | 'decline') {
  error.value = ''
  busy.value = true
  try {
    await $fetch(`/api/pairings/${id}/${action}`, { method: 'POST' })
    await navigateTo(action === 'accept' ? `/korespondenci/${id}/nowy` : '/listy')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div class="page">
    <ScreenTop back="/listy" title="Zaproszenie" />
    <main v-if="p" class="body" style="gap: 20px">
      <h1 class="h1">{{ p.partner.name }} chce z Tobą korespondować</h1>
      <div class="paper" style="display: flex; flex-direction: column; gap: 14px; position: relative">
        <div class="postmark" aria-hidden="true" style="position: absolute; right: 12px; top: -20px; width: 72px; height: 72px; font-size: 10px; background: #FFFDF8">PENPAL<br>ZAPROSZENIE</div>
        <div class="row">
          <div class="avatar" aria-hidden="true" style="background: #D9E0D0">{{ initial(p.partner.name) }}</div>
          <div>
            <h2 class="h2">{{ p.partner.name }}</h2>
            <div class="muted">{{ ageLabel(p.partner.ageRange) }} · {{ channelLabel(p.partner.channel) }}</div>
          </div>
        </div>
        <p class="p" style="font-size: 17px; line-height: 32px">{{ p.partner.bio }}</p>
        <div v-if="p.sharedInterests.length" style="display: flex; flex-direction: column; gap: 8px">
          <div class="label">Wspólne zainteresowania</div>
          <div class="chips" style="gap: 6px"><span v-for="i in p.sharedInterests" :key="i" class="tag">{{ i }}</span></div>
        </div>
      </div>
      <InfoNote icon="lock">Nie zobaczycie nawzajem swoich adresów ani miast.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <p v-else-if="loadError" class="error" role="alert" style="padding: 20px">{{ errorText(loadError) }}</p>
    <div v-if="p?.status === 'INVITED'" class="foot">
      <AppButton variant="stamp" :disabled="busy" @click="act('accept')">Przyjmij zaproszenie</AppButton>
      <AppButton variant="outline" :disabled="busy" @click="act('decline')">Odrzuć</AppButton>
    </div>
  </div>
</template>
