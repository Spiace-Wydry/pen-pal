<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { decline, initial } from '#shared/utils/polish'
import { REPORT_REASONS } from '#shared/utils/reports'

definePageMeta({ layout: 'plain' })
const id = useRoute().params.id as string
const { data: p, error: loadError } = await useFetch<PairingView>(`/api/pairings/${id}`)
const reason = ref<string>(REPORT_REASONS[0])
const details = ref('')
const confirmBlock = ref(false)
const sent = ref(false)
const error = ref('')
const busy = ref(false)

async function report() {
  error.value = ''
  busy.value = true
  try {
    await $fetch('/api/reports', { method: 'POST', body: { pairingId: id, reason: reason.value, details: details.value } })
    sent.value = true
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}

async function block() {
  if (!confirmBlock.value) { confirmBlock.value = true; return }
  error.value = ''
  busy.value = true
  try {
    await $fetch(`/api/pairings/${id}/block`, { method: 'POST' })
    await navigateTo('/listy')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <div v-if="p" class="page">
    <ScreenTop :back="`/korespondenci/${id}`" title="Zgłoś korespondenta" />
    <main class="body" style="gap: 14px">
      <div class="card row" style="padding: 12px 16px">
        <div class="avatar" style="width: 44px; height: 44px; font-size: 18px" aria-hidden="true">{{ initial(p.partner.name) }}</div>
        <div style="flex: 1">
          <div class="muted" style="font-size: 14px">Zgłaszasz osobę</div>
          <div style="font-weight: 700; font-size: 18px">{{ p.partner.name }} · {{ p.palKod }}</div>
        </div>
        <NuxtLink to="/listy" style="font-weight: 700; min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
      </div>
      <div class="note" style="background: #F3E2DA">
        <AppIcon name="alert" :size="22" style="color: #8C3520" />
        <span>Nigdy nie podawaj danych do konta ani nie wysyłaj pieniędzy. PiszuPiszu nigdy o to nie prosi.</span>
      </div>

      <InfoNote v-if="sent" icon="check">Dziękujemy. Sprawdzimy zgłoszenie i odezwiemy się w aplikacji.</InfoNote>
      <template v-else>
        <fieldset style="border: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px">
          <legend class="label" style="padding: 4px 0 10px">Co się stało?</legend>
          <RadioCard v-for="r in REPORT_REASONS" :key="r" v-model="reason" name="reason" :value="r" style="padding: 14px 16px">
            <span style="font-size: 17px">{{ r }}</span>
          </RadioCard>
        </fieldset>
        <div class="field">
          <label class="label" for="det">Opisz krótko (opcjonalnie)</label>
          <textarea id="det" v-model="details" class="input" maxlength="1000" placeholder="Co się wydarzyło?" style="min-height: 64px; padding: 12px 14px; resize: none" />
        </div>
      </template>

      <InfoNote v-if="confirmBlock" icon="info" alert>Na pewno? Nie dostaniesz już listów od {{ decline(p.partner.name, 'gen') }}, a Wasz PiszuKod przestanie działać.</InfoNote>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton v-if="!sent" variant="stamp" :disabled="busy" @click="report">Wyślij zgłoszenie</AppButton>
      <AppButton variant="outline" :disabled="busy" @click="block">
        {{ confirmBlock ? 'Tak, zablokuj' : `Zablokuj ${decline(p.partner.name, 'acc')}` }}
      </AppButton>
    </div>
  </div>
  <p v-else-if="loadError" class="error" role="alert" style="padding: 20px">{{ errorText(loadError) }}</p>
</template>
