<script setup lang="ts">
import type { PairingView } from '#shared/types/api'
import { ageLabel, channelLabel, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'default' })
const { profile, refreshProfile, saveProfile } = useProfile()
await refreshProfile()
const { data: pairings } = await useFetch<PairingView[]>('/api/pairings', { default: () => [] })
const firstActive = computed(() => pairings.value.find(p => p.status === 'ACTIVE'))

const premiumInfo = ref(false)
const ffMessage = ref('')
const error = ref('')

async function toggle(key: 'notifyNewLetter' | 'notifyDelivered', value: boolean) {
  error.value = ''
  try { await saveProfile({ [key]: value }) }
  catch (e) { error.value = errorText(e) }
}

async function fastForward() {
  ffMessage.value = ''
  try {
    const { moved } = await $fetch<{ moved: number }>('/api/demo/fast-forward', { method: 'POST' })
    ffMessage.value = `Gotowe — przesunięto listy: ${moved}.` // (new copy)
  }
  catch (e) { ffMessage.value = errorText(e) }
}
</script>

<template>
  <div v-if="profile" class="page">
    <header class="row" style="padding: 32px 20px 8px">
      <div class="avatar" aria-hidden="true" style="width: 64px; height: 64px; border-radius: 32px; font-size: 26px">{{ initial(profile.name ?? '') }}</div>
      <div style="flex: 1; min-width: 0">
        <h1 class="h1" style="font-size: 28px">{{ profile.name }}</h1>
        <div class="muted">
          {{ profile.ageRange ? ageLabel(profile.ageRange) : '' }} · {{ profile.channel ? channelLabel(profile.channel) : '' }}
          <!-- (new copy): channel and bio are edited on the Kanał screen -->
          <NuxtLink to="/profil/kanal?edit=1" style="font-weight: 700; margin-left: 8px; min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
        </div>
      </div>
      <NuxtLink class="chip" to="/profil/o-mnie?edit=1">Edytuj</NuxtLink>
    </header>
    <main class="body" style="gap: 14px; padding-top: 12px">
      <section class="card" style="display: flex; flex-direction: column; gap: 10px">
        <div class="label">Zainteresowania</div>
        <div class="chips" style="gap: 6px">
          <span v-for="i in profile.interests" :key="i" class="tag">{{ i }}</span>
          <NuxtLink to="/profil/zainteresowania?edit=1" style="align-self: center; font-weight: 700">Zmień</NuxtLink>
        </div>
        <div class="divider" />
        <div class="row" style="justify-content: space-between">
          <div>
            <div class="label">Adres pocztowy</div>
            <div class="muted">Ukryty · widzi go tylko PenPal</div>
          </div>
          <NuxtLink to="/profil/o-mnie?edit=1" style="font-weight: 700; min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
        </div>
      </section>

      <section class="card" style="display: flex; flex-direction: column; gap: 10px; background: #1F2A44; border-color: #1F2A44; color: #FBF7EE">
        <div class="row" style="justify-content: space-between">
          <h2 class="h2" style="color: #FBF7EE">PenPal Premium</h2>
          <div class="postmark" aria-hidden="true" style="width: 52px; height: 52px; font-size: 8px; color: #F0B8A6; border-color: #F0B8A6">PREMIUM</div>
        </div>
        <p style="margin: 0; font-size: 16px; line-height: 1.45; color: #E4DED2">Pisz z większą liczbą osób — do 5 korespondentów zamiast 3.</p>
        <button type="button" class="btn" style="background: #FBF7EE; color: #1F2A44; min-height: 50px" :disabled="premiumInfo" @click="premiumInfo = true">Dowiedz się więcej</button>
        <!-- (new copy): payments are out of scope -->
        <InfoNote v-if="premiumInfo" icon="info">Premium uruchomimy wkrótce. Damy Ci znać w aplikacji.</InfoNote>
      </section>

      <section class="card" style="display: flex; flex-direction: column; gap: 12px">
        <div class="label">Powiadomienia</div>
        <label class="row" style="justify-content: space-between; min-height: 48px; font-size: 17px">
          Przyszedł nowy list
          <input type="checkbox" :checked="profile.notifyNewLetter" style="width: 26px; height: 26px; accent-color: #1F2A44; margin: 0" @change="toggle('notifyNewLetter', ($event.target as HTMLInputElement).checked)">
        </label>
        <label class="row" style="justify-content: space-between; min-height: 48px; font-size: 17px">
          Mój list dotarł
          <input type="checkbox" :checked="profile.notifyDelivered" style="width: 26px; height: 26px; accent-color: #1F2A44; margin: 0" @change="toggle('notifyDelivered', ($event.target as HTMLInputElement).checked)">
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </section>

      <NuxtLink v-if="firstActive" class="card row" style="justify-content: space-between" :to="`/korespondenci/${firstActive.id}/zglos`">
        <span class="row"><AppIcon name="shield" />Zgłoś korespondenta</span>
        <AppIcon name="chevron" style="color: #5E667A" />
      </NuxtLink>

      <!-- Demo helper: low-key on purpose -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding-top: 8px">
        <button type="button" class="muted" style="background: none; border: none; text-decoration: underline; min-height: 48px; cursor: pointer; font-family: inherit" @click="fastForward">Przewiń czas o 2 dni</button>
        <p v-if="ffMessage" class="muted" role="status">{{ ffMessage }}</p>
      </div>
    </main>
  </div>
</template>
