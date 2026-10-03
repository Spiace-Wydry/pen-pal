<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { DELIVERY_MS } from '#shared/utils/letters'
import { onDay } from '#shared/utils/polish'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p, error: loadError } = await useFetch<PairingView>(`/api/pairings/${id}`)
const { draft, clear } = useLetterDraft(id)
const paper = computed(() => p.value?.partner.channel === 'PAPER')
// Display estimate only; the server sets deliver_at.
const eta = onDay(new Date(Date.now() + DELIVERY_MS).toISOString())
const error = ref('')
const busy = ref(false)

onMounted(() => {
  const empty = draft.value.mode === 'SCAN' ? !draft.value.pages.length : !draft.value.body.trim()
  if (empty) navigateTo(`/korespondenci/${id}/napisz`, { replace: true })
})

async function send() {
  error.value = ''
  busy.value = true
  try {
    const fd = new FormData()
    fd.append('pairingId', id)
    if (draft.value.mode === 'SCAN') draft.value.pages.forEach(f => fd.append('pages', f))
    else fd.append('body', draft.value.body)
    const { id: letterId } = await $fetch<{ id: string }>('/api/letters', { method: 'POST', body: fd })
    clear()
    await navigateTo(`/listy/${letterId}/status`)
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}/${draft.mode === 'SCAN' ? 'zdjecie' : 'napisz'}`" title="Wyślij" />
    <main class="body" style="gap: 16px">
      <h1 class="h1">Twój list jest gotowy</h1>
      <div class="card" style="display: flex; gap: 14px; align-items: flex-start">
        <AppIcon :name="paper ? 'printer' : 'mail'" :size="28" style="color: #A8432A; margin-top: 2px" />
        <div style="display: flex; flex-direction: column; gap: 6px">
          <div class="h2" style="font-size: 20px">
            {{ paper ? `${p.partner.name} dostanie go na papierze` : `${p.partner.name} przeczyta go w aplikacji` }}
          </div>
          <!-- Profiles have no gender, so "wybrała/wybrał" is rephrased neutrally ("woli listy papierowe"). -->
          <p v-if="paper" class="muted">{{ p.partner.name }} woli listy papierowe. Wydrukujemy Twój list i wyślemy go pocztą. Nadawcą na kopercie będzie PenPal — Twój adres pozostaje ukryty.</p>
          <p v-else class="muted">{{ p.partner.name }} czyta listy w aplikacji PenPal.</p>
        </div>
      </div>
      <InfoNote icon="info">To odbiorca decyduje, jak dostaje listy: na papierze czy w aplikacji.</InfoNote>
      <div class="card" style="display: flex; gap: 14px; align-items: center">
        <div class="postmark" aria-hidden="true" style="width: 64px; height: 64px; font-size: 9px; flex: none">2 DNI</div>
        <div style="display: flex; flex-direction: column; gap: 4px">
          <div style="font-weight: 700; font-size: 17px">Dotrze {{ eta }}</div>
          <p class="muted">Każdy list idzie 2 dni — jak prawdziwa poczta.</p>
        </div>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton variant="stamp" :disabled="busy" @click="send">Wyślij list</AppButton>
    </div>
  </div>
  <p v-else-if="loadError" class="error" role="alert" style="padding: 20px">{{ errorText(loadError) }}</p>
</template>
