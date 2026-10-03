<script setup lang="ts">
import { ageLabel, channelLabel, initial } from '#shared/utils/polish'

definePageMeta({ layout: 'default' })
const { profile, refreshProfile, saveProfile } = useProfile()
await refreshProfile()

const premiumInfo = ref(false)
const ffMessage = ref('')
const error = ref('')

async function toggle(key: 'notifyNewLetter', el: HTMLInputElement) {
  const value = el.checked
  error.value = ''
  try { await saveProfile({ [key]: value }) }
  catch (e) {
    el.checked = !value // uncontrolled input: revert the DOM on failed save
    error.value = errorText(e)
  }
}

async function signOut() {
  await useSupabaseClient().auth.signOut()
  profile.value = null
  await navigateTo('/')
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
    <header class="row" style="padding: 32px 20px 8px; align-items: flex-start">
      <div class="avatar" aria-hidden="true" style="width: 64px; height: 64px; border-radius: 32px; font-size: 26px">{{ initial(profile.name ?? '') }}</div>
      <div style="flex: 1; min-width: 0">
        <h1 class="h1" style="font-size: 28px">{{ profile.name }}</h1>
        <div class="muted">
          {{ profile.ageRange ? ageLabel(profile.ageRange) : '' }} · {{ profile.channel ? channelLabel(profile.channel) : '' }}
        </div>
      </div>
      <NuxtLink class="chip" to="/profil/o-mnie?edit=1">Edytuj</NuxtLink>
    </header>
    <main class="body" style="gap: 14px; padding-top: 12px">
      <section class="card" style="display: flex; flex-direction: column; gap: 10px">
        <div class="row" style="justify-content: space-between">
          <div class="label">Zainteresowania</div>
          <NuxtLink to="/profil/zainteresowania?edit=1" style="font-weight: 700; min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
        </div>
        <div class="tag-grid">
          <span v-for="i in profile.interests" :key="i" class="tag">{{ i }}</span>
        </div>
        <div class="divider" />
        <!-- Channel and bio are edited on the Kanał screen; labels reuse its copy -->
        <div class="row" style="justify-content: space-between">
          <div>
            <div class="label">Jak wolisz pisać?</div>
            <div class="muted">{{ profile.channel === 'PAPER' ? 'List papierowy' : 'Wiadomość w aplikacji' }}</div>
          </div>
          <NuxtLink to="/profil/kanal?edit=1" aria-label="Zmień sposób pisania" style="font-weight: 700; min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
        </div>
        <div class="divider" />
        <div class="row" style="justify-content: space-between; align-items: flex-start">
          <div style="min-width: 0">
            <div class="label">Krótko o mnie</div>
            <div class="muted bio-preview">{{ profile.bio || '—' }}</div>
          </div>
          <NuxtLink to="/profil/kanal?edit=1" aria-label="Zmień opis o sobie" style="font-weight: 700; min-height: 48px; display: inline-flex; align-items: center; flex: none">Zmień</NuxtLink>
        </div>
        <div class="divider" />
        <div class="row" style="justify-content: space-between">
          <div>
            <div class="label">Adres pocztowy</div>
            <div class="muted">Ukryty · widzi go tylko PiszuPiszu</div>
          </div>
          <NuxtLink to="/profil/o-mnie?edit=1" style="font-weight: 700; min-height: 48px; display: inline-flex; align-items: center">Zmień</NuxtLink>
        </div>
      </section>

      <section class="card" style="display: flex; flex-direction: column; gap: 10px; background: #1F2A44; border-color: #1F2A44; color: #FBF7EE">
        <div class="row" style="justify-content: space-between">
          <h2 class="h2" style="color: #FBF7EE">PiszuPiszu Premium</h2>
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
          <input type="checkbox" :checked="profile.notifyNewLetter" style="width: 26px; height: 26px; accent-color: #1F2A44; margin: 0" @change="toggle('notifyNewLetter', $event.target as HTMLInputElement)">
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </section>


      <!-- (new copy) -->
      <AppButton variant="outline" @click="signOut">Wyloguj się</AppButton>

      <!-- Demo helper: low-key on purpose -->
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px; padding-top: 8px">
        <button type="button" class="muted" style="background: none; border: none; text-decoration: underline; min-height: 48px; cursor: pointer; font-family: inherit" @click="fastForward">Przewiń czas o 2 dni</button>
        <p v-if="ffMessage" class="muted" role="status">{{ ffMessage }}</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Equal-width interest badges, two per row */
.tag-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.tag-grid .tag { justify-content: center; text-align: center; }
.bio-preview { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
