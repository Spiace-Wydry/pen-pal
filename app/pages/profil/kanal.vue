<script setup lang="ts">
import type { Channel } from '#shared/utils/rules'

definePageMeta({ layout: 'plain' })
const route = useRoute()
const edit = computed(() => route.query.edit === '1')
const { profile, refreshProfile, saveProfile } = useProfile()
if (!profile.value) await refreshProfile()

const channel = ref<string>(profile.value?.channel ?? 'APP')
const bio = ref(profile.value?.bio ?? '')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await saveProfile({ channel: channel.value as Channel, bio: bio.value })
    if (edit.value) return await navigateTo('/profil')
    // Demo helper: a seeded pen pal invites the new user, so screen 9 is reachable.
    await $fetch('/api/demo/invite', { method: 'POST' }).catch(() => null)
    await navigateTo('/szukamy')
  }
  catch (e) { error.value = errorText(e) }
  finally { busy.value = false }
}
</script>

<template>
  <form class="page" @submit.prevent="submit">
    <ScreenTop :back="edit ? '/profil' : '/profil/zainteresowania'">
      <template v-if="!edit" #center><StepProgress :step="4" /></template>
    </ScreenTop>
    <main class="body" style="gap: 16px">
      <h1 class="h1">Jak wolisz pisać?</h1>
      <RadioCard v-model="channel" name="channel" value="PAPER">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <div class="h2" style="font-size: 20px">List papierowy</div>
          <p class="muted">Piszesz ręcznie i zanosisz list do PalPointu lub PalBoxa.</p>
        </div>
      </RadioCard>
      <RadioCard v-model="channel" name="channel" value="APP">
        <div style="display: flex; flex-direction: column; gap: 4px">
          <div class="h2" style="font-size: 20px">Wiadomość w aplikacji</div>
          <p class="muted">Piszesz tutaj. Jeśli Twój korespondent woli papier, wydrukujemy i wyślemy list pocztą.</p>
        </div>
      </RadioCard>
      <div class="field">
        <label class="label" for="bio">Krótko o mnie</label>
        <textarea id="bio" v-model="bio" class="input" maxlength="300" style="min-height: 120px; padding: 12px 14px; line-height: 1.45; resize: none" aria-describedby="bio-count" />
        <p id="bio-count" class="muted" style="text-align: right">{{ bio.length }} / 300</p>
      </div>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </main>
    <div class="foot">
      <AppButton variant="stamp" type="submit" :disabled="busy">{{ edit ? 'Zapisz' : 'Znajdź mi korespondenta' }}</AppButton>
    </div>
  </form>
</template>
